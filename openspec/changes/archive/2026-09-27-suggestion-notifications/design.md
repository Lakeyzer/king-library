## Context

See proposal.md for motivation and specs/ for the behavior contract.

Current state:
- `suggestions` is authenticated-readable. Admins can update it through the `suggestions status updatable by admin` RLS policy, and a `revoke update` / `grant update (status)` pair limits which columns they can touch.
- Admin identity is the JWT `app_metadata.role = 'admin'` claim, checked the same way in RLS and in `useSuggestions().isAdmin`.
- The status change today is a direct client-side `supabase.from('suggestions').update({ status })` inside `useSuggestions`.
- The app sends no emails of its own. The only server route that uses the service role is `server/api/account.delete.ts`, which uses `serverSupabaseServiceRole` and `serverSupabaseUser` from `#supabase/server`. `server/api/tmdb/` is the precedent for a server-only secret in `runtimeConfig` (`tmdbApiKey`).
- The header account menu is a static `DropdownMenuItem[][]` in `app/components/core/AppHeader.vue`. That component already watches `user` to refresh per-user stores.

## Goals / Non-Goals

**Goals:**
- Notification rows are created in the database, in the same transaction as the change that caused them. They can't be skipped by a client that forgets a second call, or by an admin editing from the Supabase dashboard.
- Emails are sent server-side only. The Resend key and recipients' email addresses never reach the browser.
- An email failure never rolls back or blocks the status change.
- Any notification is emailed at most once.

**Non-Goals:**
- No push notifications, and no live updating of the notification center's own list. Realtime only drives the header's unread dot and count (see "Live unread updates").
- No browser or PWA push notifications. This is in line with the PWA non-goals in CLAUDE.md.
- No per-notification delete or "mark unread", and no retention cleanup job.
- No deep link from a notification to the individual suggestion. The Suggestion Box has no per-suggestion URL today, so the notification itself carries the title, status and response text.
- No notifications for anything other than suggestions. Reports have no author-facing status today.
- No email digests or batching. Each status change sends one email.
- No follower email yet. The preferences model is built so it can be added later (see "Email preferences"), but this change adds no `new_follower` column, toggle or sending code.

## Decisions

### Notifications are created by a `security definer` trigger on `suggestions`, not by application code

This is an `after update of status, admin_comment on suggestions` trigger with `security definer` and `set search_path = ''`. It inserts into `notifications` when:
- `new.status is distinct from old.status`, which inserts a `suggestion_status_changed` row, or
- `new.admin_comment is distinct from old.admin_comment and new.admin_comment is not null`, which inserts a `suggestion_commented` row.

There is no self-skip: an admin acting on their own suggestion is notified like any other author. With a single admin who rarely submits suggestions, a notification about your own change is harmless, and it keeps the rule simple.

`security definer` is required because `notifications` has no insert policy for `authenticated`. Users must never be able to write notifications for each other, and the trigger is the only writer.

**Alternative considered:** insert the notification from the server route. Rejected because the admin response is saved client-side (see below) and would need its own route just to do this. It would also silently skip notifications for any update made outside the app.

### `notifications` table shape: typed row with snapshot columns

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('suggestion_status_changed', 'suggestion_commented')),
  suggestion_id uuid not null references suggestions (id) on delete cascade,
  suggestion_title text not null,
  status text,          -- new status, for suggestion_status_changed
  admin_comment text,   -- response text at that moment, for suggestion_commented
  read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on notifications (user_id, created_at desc);
create index notifications_user_unread_idx on notifications (user_id) where read_at is null;
```

- **Snapshots:** the title, status and response are copied onto the row, so a notification still reads correctly after the admin edits the response again or changes the status once more. "The response text as it was at that moment" is required by the spec.
- **Suggestion FK:** `suggestion_id` is a real FK with `on delete cascade`, which covers "Notifications are removed with their suggestion" with no extra code.
- **Type column:** a `type` text column with a check constraint follows the existing `reports.type` style. It stays open to other notification sources later without a schema rewrite.

**RLS:**
- `select` is owner-only (`user_id = auth.uid()`).
- `update` is owner-only, narrowed with `revoke update ... from authenticated; grant update (read_at) ...`. This mirrors the `suggestions` status grant, so a user can only mark their own notifications read.
- There are no insert or delete policies.
- `email_sent_at` is only written through the service role.

### Admin response: two columns on `suggestions`, saved client-side

- **Columns:** add `admin_comment text` (nullable) and `admin_comment_updated_at timestamptz`, plus a check `admin_comment is null or (char_length(btrim(admin_comment)) > 0 and char_length(admin_comment) <= 1000)`.
- **Timestamp:** a `before update` trigger sets `admin_comment_updated_at = now()` whenever `admin_comment` changes, so the client never supplies the timestamp.
- **Grant:** widen the column grant to `grant update (status, admin_comment) on suggestions to authenticated`. The existing admin-only update policy still gates which rows can be updated.
- **View:** `suggestions_with_author` is extended with `create or replace view`, appending `admin_comment` and `admin_comment_updated_at`. The existing columns are unchanged, following the pattern used when votes were added.
- **Clearing:** the client trims the input and sends `null` for an empty response, which is how "saving an empty response clears it" works.

A single response per suggestion was the user's choice over a comment thread, which keeps this to two columns instead of a new table.

Saving a response stays a direct `useSuggestions().updateAdminComment()` call, not a server route, because it never sends an email. It still produces its in-app notification through the trigger above.

### Status change moves to `PATCH /api/suggestions/[id]/status`

The email has to be sent server-side, and it has to be sent after the status update commits. `server/api/suggestions/[id]/status.patch.ts`:

1. **Authenticate.** `serverSupabaseUser(event)` returns 401 if signed out and 403 if `app_metadata.role !== 'admin'`. This is only an early exit for a clear error; RLS still enforces admin access.
2. **Validate.** The body's `status` must be one of the four values, otherwise return 400.
3. **Update as the user.** Use `serverSupabaseClient(event)`, the user-scoped client, not the service role, so RLS applies to the update. Run `.update({ status }).eq('id', id).select('id')`. Zero rows returned means 404.
4. **Find the notification to email.** With `serverSupabaseServiceRole(event)`, fetch the newest `suggestion_status_changed` notification for this suggestion where `email_sent_at is null`. If there is none, the status didn't really change, so return.
5. **Check the preference.** Call `getEmailPreferences(event, recipientId)` (see "Email preferences" below). If `suggestion_updates` is false, return.
6. **Send.** Look up the recipient's email with `auth.admin.getUserById`, then send through Resend and set `email_sent_at = now()` on success.
7. **Handle failure.** Steps 4-6 run in a `try/catch` that logs and swallows errors. The response is `{ success: true, emailSent: boolean }`, so the status change always succeeds for the admin.

The email is sent with `await` before responding, not fired and forgotten, because Vercel functions can be frozen as soon as the response is sent.

`useSuggestions().updateSuggestionStatus` switches to `$fetch('/api/suggestions/${id}/status', { method: 'PATCH', body: { status } })`. Its signature is unchanged, so `suggestion-box.vue` doesn't change for this.

**Alternative considered:** a Supabase Database Webhook, or `pg_net` from the trigger, calling a Nuxt endpoint or an Edge Function. This is more decoupled, but it adds a webhook secret, needs Docker-to-host networking for local development, and adds a new moving part that the project doesn't use anywhere yet. Rejected for now. The notification row with `email_sent_at` means switching to it later wouldn't change the schema.

### Resend over plain `fetch`, no SDK dependency

`server/utils/sendEmail.ts` POSTs to `https://api.resend.com/emails` with `$fetch` and `Authorization: Bearer ${runtimeConfig.resendApiKey}`.

- **Config:** add `resendApiKey: process.env.RESEND_API_KEY` and `emailFrom: process.env.EMAIL_FROM` (for example `King Library <notifications@king-library.com>`) to `runtimeConfig`. Both are server-only, next to `tmdbApiKey`.
- **Missing key:** if `resendApiKey` is unset, which is the normal local development case, the helper logs the email it would have sent and returns without throwing. The flow can be exercised locally without a Resend account.
- **Template:** `server/utils/suggestionStatusEmail.ts` builds the subject (`Your suggestion "<title>" is now <Status>`), a plain-text body and a minimal inline-styled HTML body. The suggestion title is HTML-escaped. Links are built from `getRequestURL(event).origin`, so local emails link to localhost. The body links to `/notifications` and to `/settings` for turning emails off.

### Email preferences: own table, one boolean column per email type

More email types are planned, starting with a "someone followed you" email, so preferences get their own table instead of a column on `profiles`:

```sql
create table email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  suggestion_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
```

- **RLS:** owner-only `select`, `insert` and `update` (`user_id = auth.uid()`), with no delete policy. The row is removed with the account through the cascade. This keeps preferences private. `profiles` is readable by everyone, which is why it was the wrong home for them.
- **Missing row means defaults:** no row is created at sign-up and there's no backfill. Existing and new users have no row until they first change a toggle, and every reader treats a missing row as all columns at their default (`true`). This covers the spec's "on by default, including existing users" without a trigger on `auth.users`.
- **Writes:** the client upserts on `user_id`, sending only the changed column plus `updated_at`, so the first toggle change creates the row.
- **Server reads:** `server/utils/emailPreferences.ts` exports `getEmailPreferences(event, userId)`. It selects the row with the service-role client and merges it over a `DEFAULT_EMAIL_PREFERENCES` object, so callers always get a fully populated object. Every email-sending path goes through this helper.
- **Client:** a new `useEmailPreferences()` composable exposes `preferences` (with defaults applied the same way) and `updatePreference(key, enabled)`. `EmailPreferenceKey` is derived from the generated table type, so adding a column automatically widens the key type.
- **Settings UI:** an "Email notifications" section renders one `USwitch` per entry in an `EMAIL_PREFERENCE_OPTIONS` list (`{ key, label, description }`), which starts with `suggestion_updates` / "Suggestion updates".
- **Adding a future email type** (for example the follower email): one migration, `alter table email_preferences add column new_follower boolean not null default true`, then one `DEFAULT_EMAIL_PREFERENCES` entry, one `EMAIL_PREFERENCE_OPTIONS` entry, and a `getEmailPreferences` check in whatever sends that email. There are no data migrations, because missing rows and existing rows both pick up the column default.

**Alternative considered:** a row per email type, `email_preferences(user_id, email_type, enabled)`, where a missing row means the default. It needs no `alter table` per type, but reads become key/value lookups with a loosely typed `email_type` string, and a type-list check constraint still has to change for each new type. With only a handful of email types expected, typed columns are simpler and safer.

### Unread state: shared `useState` count, refreshed client-side

- **Composable:** `useNotifications()` holds `unreadCount` in `useState('notifications-unread-count', () => 0)` and exposes:
  - `fetchUnreadCount()`: a head-only `count: 'exact'` query with `read_at is null`, and 0 when signed out
  - `fetchNotifications({ page, pageSize })`
  - `markAllRead()`: `update({ read_at: now })` where `read_at is null`, which also sets `unreadCount` to 0
- **Header:** `AppHeader` calls `fetchUnreadCount()` in `onMounted`, in its existing `watch(user)`, and in a `watch(() => route.path)`. It runs client-side only, so no query is added to every SSR render. The dot showing up a moment after hydration is acceptable.
- **Dot:** a `<UChip :show="unreadCount > 0" inset>` around the user icon, inside the account button's `#leading` slot. It sits inside the button rather than around it, so the button stays the dropdown trigger that gets its ARIA state.
- **Menu entry:** the Notifications entry sits in the settings section and carries the count as the item's trailing badge. `accountMenuItems` becomes a `computed` so it can react to the count.

### Live unread updates: Supabase Realtime Postgres Changes

- **Publication:** the migration adds `notifications` to the `supabase_realtime` publication, which is what makes Realtime stream its changes.
- **Subscription:** `useNotifications().subscribeToUnread()` opens one channel per signed-in user (`notifications:<user id>`). It listens for `INSERT` and `UPDATE` on `public.notifications` filtered to `user_id=eq.<user id>`, and returns an unsubscribe function.
- **Handling events:** every event just calls `fetchUnreadCount()` instead of patching the count from the payload. It's one tiny query, it's always exactly right, and it covers both cases: a new notification (count goes up) and a mark-read in another tab (count goes to 0). The existing generation guard still protects against a stale count landing after this tab's own `markAllRead()`.
- **Lifecycle:** `AppHeader`, which is mounted on every page, subscribes on mount and re-subscribes in its existing `watch(user)`, unsubscribing from any previous channel first. Signing out leaves no channel open. It runs client-only.
- **Fallback:** the on-mount and on-navigation `fetchUnreadCount()` calls stay, so a dropped socket only delays the dot until the next navigation.
- **Toast on arrival:** `subscribeToUnread({ onNew })` also passes each `INSERT` payload, mapped to a `NotificationEntry`, to an `onNew` callback. `AppHeader` uses it to show a Nuxt UI toast, for example 'Your suggestion "X" changed to Confirmed' or 'An admin responded to "X"', with a "View" action linking to `/notifications`. Only `INSERT` events toast, and Realtime only delivers changes made after the channel subscribed. So notifications that were already waiting on page load never toast, and only show the dot and count, with no extra "seen" bookkeeping. Each open tab shows its own toast, which is acceptable.
- **Security:** Postgres Changes checks the subscriber's RLS `select` policy before sending each change, so the owner-only policy on `notifications` already means a user can only ever receive their own rows. The `user_id` filter just avoids evaluating other users' rows.

**Alternative considered:** Realtime Broadcast from the database, with a trigger calling `realtime.broadcast_changes`, private channels and `realtime.messages` policies. Supabase recommends it for high-volume apps, but it adds a second trigger plus channel authorization policies for no benefit at this scale. Postgres Changes needs one line of SQL.

### Notification center page

`app/pages/notifications.vue` uses the default layout and is added to `isAuthGatedRoute` and to the sitemap `exclude` list.

- **Load:** `useAsyncData` fetches the first page with 20 per page, then `markAllRead()` runs client-side once the data is in.
- **Highlight:** the "new" highlight for this visit comes from the fetched rows' `read_at === null`, captured before marking, so it survives the mark-read call as the spec requires.
- **Entries:** each entry shows:
  - an icon per type
  - "Status changed to <badge>" or "Admin responded", with the response text for the latter
  - the suggestion title, through `NumberMotif` like everywhere else
  - a relative timestamp
- **Shared status labels:** `STATUS_LABEL` and `STATUS_COLOR` move out of `SuggestionList.vue` into an exported constant, so the badge looks the same in both places.
- **Empty state:** `UEmpty`.

### Admin response UI in `SuggestionList.vue`

The accordion `#body` slot renders the response below the suggestion body in a subtle bordered block with an "Admin response" label, an icon and the updated-at date.

Admins see a `UTextarea` (maxlength 1000, with a counter) and Save/Clear buttons in the same slot, emitting a new `update-comment` event. `suggestion-box.vue` handles it by calling `updateAdminComment` and then `load()`.

The collapsed row shows a small `i-lucide-message-square` icon with a tooltip when `adminComment` is set. It sits outside the `@click.stop` controls cluster, so it needs none of the nested-button workarounds.

## Risks / Trade-offs

- **[Resend domain not verified before merge]** Sends fail silently, since errors are logged and swallowed, until DNS is set up. → The migration plan verifies the domain and sets the Vercel env vars before merging. `email_sent_at` stays null on failed rows, so failures can be found with a query.
- **[Step 4 picks the wrong notification if two status changes race]** Two admins changing the same suggestion within milliseconds could each email the other's row. → With a single admin today this is harmless. Each row is still emailed at most once because of the `email_sent_at is null` filter plus setting it after sending.
- **[Realtime connection drops]** A network blip or a sleeping laptop can close the socket. → supabase-js reconnects on its own, and the on-navigation refresh is a fallback until it does.
- **[Realtime quotas]** Each signed-in tab holds one WebSocket connection. → The free plan's 200 concurrent connections and 2M messages a month are far above this app's usage. If that ever changes, switch to Broadcast (see "Live unread updates").
- **[Notification center list isn't live]** A notification that arrives while you're on `/notifications` shows the dot, but doesn't appear in the list until you reload or navigate back. → Accepted per Non-Goals.
- **[`security definer` trigger misuse]** → The function sets an empty `search_path`, schema-qualifies every reference, and only inserts rows derived from `new`/`old`. It takes no caller input.
- **[Admin email address exposure]** The service-role client can read any user's email. → It is only used inside the server route, after the admin check, and only for the one recipient of the notification being sent.

## Migration Plan

1. One local migration, `add_suggestion_notifications`, containing:
   - the `suggestions` columns, check constraint, `before update` trigger and widened grant
   - the `notifications` table, indexes, RLS and grants
   - the `after update` notification trigger
   - the `email_preferences` table and its RLS
   - the `suggestions_with_author` view update
   - adding `notifications` to the `supabase_realtime` publication

   Apply it locally with `supabase migration up`, never `db reset`, and regenerate `database.types.ts`.
2. Before merging to `main`:
   - Verify the sending domain in Resend.
   - Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel (Production, plus Preview if wanted).
   - Push the migration to hosted Supabase, which needs an explicit go-ahead per `supabase-conventions`.
3. Merge. Vercel deploys the route and UI.

**Rollback:** reverting the code is safe because the migration is purely additive. Old code keeps working against the new schema: the direct status update still passes the widened grant, and the trigger still creates notifications. To stop notifications entirely without a deploy, drop the `after update` trigger.

## Open Questions

- Exact email copy and HTML styling. It can be tuned during implementation or after launch without affecting anything else.
