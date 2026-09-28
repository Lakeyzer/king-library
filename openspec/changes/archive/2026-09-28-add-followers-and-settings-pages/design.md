## Context

See proposal.md - Why. The current state that shapes this design:

- **`user_follows`** (`20260911092051`): `follower_id` and `followed_id` both reference `auth.users`, with no FK to `profiles`, so `useFollowing` fetches profiles in a second query.
  - Its only select policy is `follower_id = auth.uid()`, so today nobody can read who follows them.
  - Following is a client-side `insert` from `useFollowing().follow()`, used by `ProfileHeader` (`app/components/profile/Header.vue`).
- **Notifications** (`20260927121027`, not committed yet, from the archived `suggestion-notifications` change):
  - The `notifications` table is suggestion-shaped: `suggestion_id` and `suggestion_title` are `not null`, and the type check allows only the two suggestion types.
  - Rows are written only by a `security definer` trigger.
  - Email is sent by a server route after a user-scoped write (`PATCH /api/suggestions/[id]/status`): the route finds the trigger's row through the service role, checks `getEmailPreferences()`, calls `sendEmail()` and stamps `email_sent_at`.
  - `email_preferences` has one boolean column per email type, and a missing row means all defaults.
  - The header toast and unread dot come from Realtime INSERT/UPDATE events on `notifications`.
- **`/following`** uses the `detail` layout: a main column plus an `#aside` slot for "Currently reading". The list is hand-built `UAvatar` + `NumberMotif` rows.
- **`/settings`** is one page (`app/pages/settings.vue`, `default` layout, `max-w-md` column) holding every setting.
  - `isAuthGatedRoute()` matches `/settings` exactly.
  - The OAuth link return URL is `/confirm?next=/settings`.
  - The suggestion status email links to `/settings`.
  - The sitemap excludes `/settings`.

## Goals / Non-Goals

**Goals:**
- Reuse the suggestion-notifications pipeline: trigger-created row, then a server route that emails through the service role and stamps `email_sent_at`. No second notification mechanism.
- Keep `notifications` one table with one owner-only RLS model, generalized to more than one subject.
- Split settings with a Nuxt nested route, so the aside navigation is written once.

**Non-Goals:**
- Follower counts on profiles or a public followers list for other users. Followers stay visible only to the followed user.
- Blocking or removing a follower.
- Batching or digest emails. Each notification that is created sends at most one email.
- Unfollowing from the Following tab. It is still done from the user's profile, as today.

## Decisions

### Follow moves to `POST /api/follows`; unfollow stays client-side
The email has to be sent server-side, because Resend's key is server-only and the recipient's address is only readable through the service role. The route mirrors `server/api/suggestions/[id]/status.patch.ts`:

1. `serverSupabaseUser` → 401 if missing. Validate the body `{ followedId: uuid }` → 400.
2. **Insert with the user-scoped client** (`serverSupabaseClient`), so the existing insert policy (`follower_id = auth.uid()`) and the no-self-follow check still apply.
   - A unique violation (`23505`, already following) returns success, so a double-click is harmless.
   - The self-follow check violation returns 400.
3. **Best-effort email in a `try/catch`** that only logs:
   - With the service role, select the newest `new_follower` notification where `user_id = followedId`, `actor_id = caller`, `email_sent_at is null`, created in the last minute.
   - No row means the trigger de-duplicated the follow, so nothing is emailed.
   - Otherwise check `getEmailPreferences(event, followedId).new_followers`, fetch the recipient email with `auth.admin.getUserById`, and fetch the follower's username from `profiles`.
   - `sendEmail(buildNewFollowerEmail(...))`, then stamp `email_sent_at`.
4. Return `{ success: true, emailSent }`.

`useFollowing().follow()` becomes `$fetch('/api/follows', { method: 'POST', body })`, so `ProfileHeader` and the new Follow back button need no other change. `unfollow()` stays a direct delete, since nothing is sent on unfollow.

*Alternative considered*: keep the client insert and add a `POST /api/follows/notify` call afterwards. That route is spoofable (it's a separate call the client may skip or fake) and needs a second auth check against `user_follows`. Rejected.

*Alternative considered*: a Database Webhook or `pg_net` from the trigger. That would be a new mechanism, would need a local secret setup, and doesn't match the suggestion pipeline. Rejected.

### Notification created by a trigger on `user_follows`, with 24h de-duplication in SQL
`notify_on_follow()` is `security definer` with `set search_path = ''` and runs `after insert on user_follows`.

- It inserts `(user_id = new.followed_id, type = 'new_follower', actor_id = new.follower_id)`.
- It skips the insert when a `new_follower` row with the same `user_id` and `actor_id` has `created_at > now() - interval '24 hours'`.
- The window is measured from the earlier *notification*, not the earlier follow, which matches the spec wording.

Doing the de-duplication in the trigger means the rule holds however the follow happens, and the route's "no fresh row means nothing to email" rule follows from it. There is still no insert policy on `notifications`.

### `notifications` generalized with `actor_id`, nullable suggestion columns, and a per-type check
In the migration:

```sql
alter table notifications
  alter column suggestion_id drop not null,
  alter column suggestion_title drop not null,
  add column actor_id uuid references profiles (id) on delete cascade,
  drop constraint notifications_type_valid,
  add constraint notifications_type_valid check (type in ('suggestion_status_changed', 'suggestion_commented', 'new_follower')),
  add constraint notifications_subject_valid check (
    (type = 'new_follower' and actor_id is not null and suggestion_id is null)
    or (type <> 'new_follower' and suggestion_id is not null and suggestion_title is not null)
  );
create index notifications_actor_idx on notifications (actor_id, user_id, created_at desc) where actor_id is not null;
```

- **`actor_id` references `profiles`, not `auth.users`.** The profile row cascades from `auth.users` anyway, so deleting the follower's account still removes the notification (spec: "Follower deletes their account"). Referencing `profiles` also gives PostgREST an FK to embed through: `actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)`. That shows the *current* username (spec: "Follower changes their username"), so no username snapshot is stored. This differs from `suggestion_title`, which snapshots on purpose. The index covers the cascade, the trigger's de-duplication lookup and the route's lookup.
- **Nullable suggestion columns plus a check**, rather than a separate `follow_notifications` table. The unread count, mark-all-read, pagination and Realtime subscription all work on one table unchanged.

On the client, `NotificationEntry` becomes a discriminated union on `type`:
- the suggestion variants keep `suggestionId`, `suggestionTitle`, `status` and `adminComment`
- `new_follower` carries `actor: { id, username, avatarUrl } | null`

The page, the header toast and `toNotificationEntry()` all switch on `type`.

### Realtime toast resolves the actor with one profile fetch
Realtime INSERT payloads contain only the row, with no embed. For `new_follower`, `subscribeToUnread`'s `onNew` path fetches `profiles(id, username, avatar_url)` by `actor_id` (profiles are readable by everyone) before calling `onNew`. The suggestion types are unchanged. If that fetch fails, the toast falls back to "Someone started following you".

### `user_follows`: one combined select policy, plus an index for the followed side
The migration drops `"user_follows readable by follower"` and creates `"user_follows readable by follower or followed"`:

```sql
to authenticated
using ((select auth.uid()) in (follower_id, followed_id))
```

One permissive policy performs better than two, and the `(select auth.uid())` form follows supabase-conventions. Another user's followers stay invisible (spec: "Another user's followers stay private").

Add `create index user_follows_followed_created_idx on user_follows (followed_id, created_at desc)`. The existing `unique (follower_id, followed_id)` already serves the follower-side lookup, and the Following tab's sort by `created_at` works well enough at this app's scale without a second index.

### `useFollowing`: paginated fetchers plus a full id set
- **`fetchFollowing({ page, pageSize })` and `fetchFollowers({ page, pageSize })`** each return `{ entries: { profile, followedAt }[], total }`.
  - Query `user_follows` with `count: 'exact'`, order by `created_at desc`, and use `.range()` (1-indexed page, same as `useNotifications`).
  - Then fetch `profiles` by `.in('id', ids)` and restore the follow order.
  - This keeps the existing two-query pattern, because `user_follows` has no FK to `profiles`.
- **`fetchFollowingIds()`** returns every followed id as a `Set<string>`. It is used for:
  - the "Currently reading" sidebar, which must not be limited to the current page (spec)
  - Follow back state on the Followers tab

  `fetchFollowingCurrentlyReading()` switches from `fetchFollowing()` to it, then fetches the matching profiles itself.

*Alternative considered*: one `user_follows` query embedding "do I follow them back". There is no FK path for that, and a single id set is cheaper and also serves the sidebar.

### `/following` page: `UTabs` synced to `?tab=`, one list component, `UUser` rows
- **Tabs**: `UTabs` with items `following` and `followers`, and `v-model` bound to a computed getter/setter over `route.query.tab`.
  - The setter calls `router.replace` and keeps other query keys.
  - The email links to `/following?tab=followers`.
  - Each tab has its own `page` ref, and each `useAsyncData` watches its page (`following-list`, `followers-list`).
- **Rows**: a new `app/components/following/UserList.vue` takes `entries`, `total`, `page` (v-model) and a page size of 15, and renders:
  - an `#actions` slot per entry
  - `UEmpty` for the empty state
  - `UPagination`, shown only when `total > 15`
- Each row is `UUser` with:
  - `:name` = username
  - `:description` = tagline
  - `:avatar="{ src: avatar_url ?? undefined, icon: 'i-lucide-user' }"`
  - `:to` = profile URL
  - `NumberMotif` through `UUser`'s `#name`/`#description` slots, so the number motif is kept
- **Actions**:
  - Following rows: Compare.
  - Follower rows: Compare, plus Follow back (a `UButton` with `i-lucide-user-plus`) when `!followingIds.has(id)`, otherwise a muted "Following" badge.
  - After Follow back succeeds: add the id to the set, then `refreshNuxtData(['following-list', 'following-currently-reading'])`.

Consult `nuxt-conventions` for the component name/folder before creating it.

### Settings: nested route under `pages/settings.vue` with `UPage` + `UPageAside`
- **`app/pages/settings.vue` becomes the parent** (`default` layout). It renders `UPage`, with `#left` = `UPageAside` holding a vertical `UNavigationMenu` (Profile `i-lucide-user`, Account `i-lucide-shield`, Notifications `i-lucide-bell`), and `<NuxtPage />` in the default slot.
- **Mobile navigation**: `UPageAside` is hidden below `lg`, so a horizontal `UNavigationMenu` with `class="lg:hidden"` renders above `<NuxtPage />` (spec: "Settings navigation on a small screen").
- **Children**:
  - `settings/index.vue`: `definePageMeta({ redirect: '/settings/profile' })`
  - `settings/profile.vue`: avatar (with a `UAvatar` preview), tagline, public toggle
  - `settings/account.vue`: username/email summary, sign-in methods, `LinkEmailPasswordModal`, delete account, `DeleteAccountModal`
  - `settings/notifications.vue`: the `EMAIL_PREFERENCE_OPTIONS` loop

  Logic moves over from the current `settings.vue` unchanged. Each child calls `setPageSeo` with its own title.
- **Section layout**: sections use `UPageCard` (variant `subtle`) with title/description where it helps, matching Nuxt UI's settings dashboard pattern.
- **Why a nested route is fine here**: the `profile/` nested-route problem recorded in `useProfile.ts` came from `profile/[username].vue` also being parented by `profile.vue`. `settings/` has no dynamic sibling, so that problem can't happen.

Related updates:
- `isAuthGatedRoute()` adds `|| path.startsWith('/settings/')`.
- `linkProvider` next becomes `/settings/account`.
- The status email's settings link becomes `/settings/notifications`.
- Sitemap `exclude` adds `'/settings/**'`.
- The header's Settings entry stays `/settings` (the redirect handles it). Its active state is fine because `/settings/*` starts with `/settings`.

*Alternative considered*: three standalone pages, each rendering the aside through a shared component. That duplicates the `UPage` shell three times and remounts the navigation on every switch. Rejected.

### Email preferences: add `new_followers`, stop hard-coding the select list
- Migration: `alter table email_preferences add column new_followers boolean not null default true`. Existing rows get `true`, and missing rows already mean defaults (spec: "Existing user who already changed a toggle").
- `useEmailPreferences.fetchPreferences()` selects `'*'` and picks the boolean keys, instead of the literal `'suggestion_updates'`. Adding a type then really is one column, one default and one option, as the file's comment already says.
- Update both `DEFAULT_EMAIL_PREFERENCES` copies and `EMAIL_PREFERENCE_OPTIONS`: "New followers" / "Get an email when someone starts following you."
- The server's `EmailPreferences` interface and select list gain `new_followers`.

### New follower email
`server/utils/newFollowerEmail.ts` follows `suggestionStatusEmail.ts`: the same HTML shell, `escapeHtml`, and an origin-relative link.

- **Subject**: `<username> started following you on King Library`
- **Body**: a CTA to `${origin}/following?tab=followers` and a footer pointing to "New followers" in `${origin}/settings/notifications`.
- Move `escapeHtml` into a shared `server/utils/escapeHtml.ts` rather than copying it.

## Risks / Trade-offs

- **[Risk] Follow/unfollow toggling spams notifications or emails** → 24h de-duplication per actor in the trigger, and emails only go out for rows that were actually created.
- **[Risk] The route's "created in the last minute" lookup picks up a stale unsent row** → Such a row can only be the one this insert's trigger just created, because the de-duplication window (24h) is longer than the lookup window. Stamping `email_sent_at` stops it being picked twice.
- **[Risk] The notification center is used with a stale `NotificationEntry` shape** → The union type makes TypeScript flag every consumer (page, header toast). Run `pnpm typecheck` as a task.
- **[Trade-off] Follow now goes through a server hop** → A small latency cost on a button that already shows a loading state. It is the only way to email safely.
- **[Trade-off] `fetchFollowingIds()` loads every followed id** → Fine at personal-library scale. Revisit if follow counts grow large.
- **[Risk] Old `/settings` bookmarks and the email link in already-sent suggestion emails** → `/settings` redirects to `/settings/profile`. Email settings are one click away in the aside.
- **[Risk] `suggestion-notifications` migration not yet on hosted** → This change's migration depends on it. Both must be pushed, in timestamp order, before merging.

## Migration Plan

1. Create one migration, `supabase migration new add_followers_and_follow_notifications`, containing:
   - `user_follows` policy swap and index
   - `notifications` column/constraint changes and actor index
   - `notify_on_follow()` and its trigger
   - `email_preferences.new_followers`
2. Apply locally with `supabase migration up` (never `db reset`), then regenerate `app/types/database.types.ts`.
3. At release, push to hosted after the pending `20260927121027_add_suggestion_notifications.sql` (`supabase db push` applies both in order). This needs an explicit go-ahead, asked with AskUserQuestion.
4. **Rollback**: a follow-up migration that drops the trigger/function, deletes `new_follower` rows, restores `not null` on the suggestion columns and the old type check, drops `actor_id` and `new_followers`, and restores the single follower-only select policy. Revert the app code, which still works against the old schema except for the follow route.
