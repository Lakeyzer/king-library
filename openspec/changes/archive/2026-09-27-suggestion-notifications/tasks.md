## 1. Database

- [x] 1.1 Create migration `add_suggestion_notifications`. On `suggestions`, add `admin_comment` and `admin_comment_updated_at`, the non-blank / max-1000 check constraint, and a `before update` trigger that stamps `admin_comment_updated_at` when `admin_comment` changes. Widen the column grant to `grant update (status, admin_comment)`, per `design.md` - Decisions ("Admin response"). Verify: `supabase migration up` applies cleanly.
- [x] 1.2 In the same migration, create the `notifications` table and its two indexes, per `design.md` - Decisions ("`notifications` table shape"). Enable RLS with an owner-only select policy and an owner-only update policy, then `revoke update` / `grant update (read_at)`. Add no insert or delete policies. Verify: as local test user A, querying `notifications` returns no rows belonging to user B, and trying to insert a row, or update any column other than `read_at`, fails.
- [x] 1.3 In the same migration, add the `security definer`, `set search_path = ''` `after update of status, admin_comment` trigger on `suggestions` that inserts `suggestion_status_changed` and `suggestion_commented` rows. It must skip when the status is unchanged and when the response is cleared, but still notify an admin acting on their own suggestion, per `design.md` - Decisions ("Notifications are created by a `security definer` trigger"). Verify with local SQL, run under an admin JWT claim for a suggestion owned by another user:
  - a status change inserts one row
  - setting the same status again inserts none
  - setting a response inserts one row with the text snapshot
  - clearing the response inserts none
  - updating your own suggestion inserts rows the same way (self-skip removed after manual testing; the updated function was re-applied locally with `create or replace` and re-verified)
- [x] 1.4 In the same migration, create the `email_preferences` table (`user_id` PK with `on delete cascade`, `suggestion_updates boolean not null default true`, `updated_at`). Enable RLS with owner-only select, insert and update policies and no delete policy, per `design.md` - Decisions ("Email preferences"). Verify: as local test user A, an upsert of A's own row succeeds, while selecting user B's row returns nothing and upserting a row for B fails.
- [x] 1.5 In the same migration, `create or replace` the `suggestions_with_author` view, appending `admin_comment` and `admin_comment_updated_at`. Verify: the view returns the new columns with the existing ones unchanged.
- [x] 1.6 Regenerate `app/types/database.types.ts` from local Supabase. Verify: the file contains `notifications`, `email_preferences`, the new `suggestions` columns and the updated view columns.

## 2. Email sending (server)

- [x] 2.1 Add `resendApiKey` (`RESEND_API_KEY`) and `emailFrom` (`EMAIL_FROM`) to the server-only `runtimeConfig` in `nuxt.config.ts`. Add them to `.env.development.local` as blank or placeholder values. Verify: `pnpm run typecheck` passes.
- [x] 2.2 Create `server/utils/sendEmail.ts`. It POSTs to the Resend REST API with `$fetch`. When `resendApiKey` is unset, it logs the message instead of sending and does not throw. Verify: `pnpm run typecheck` passes, and reading the code shows the no-key path logs and returns.
- [x] 2.3 Create `server/utils/suggestionStatusEmail.ts`, which builds the subject, the plain-text body and the HTML body. The title must be HTML-escaped, and the body must link to `/notifications` and `/settings` using the request origin, per `design.md` - Decisions ("Resend over plain `fetch`"). Verify: `pnpm run typecheck` and `pnpm run lint` pass, and the output contains no em dash.
- [x] 2.4 Create `server/utils/emailPreferences.ts` exporting `DEFAULT_EMAIL_PREFERENCES` and `getEmailPreferences(event, userId)`. It reads the row with the service-role client and merges it over the defaults, per `design.md` - Decisions ("Email preferences"). Verify: `pnpm run typecheck` passes, and for a local user with no row it returns `{ suggestion_updates: true }`. (Typecheck passes. The no-row default comes from merging `maybeSingle()`'s `null` over `DEFAULT_EMAIL_PREFERENCES`. That runtime result is exercised by the route checks in 7.2.)
- [x] 2.5 Create `server/api/suggestions/[id]/status.patch.ts` following the numbered flow in `design.md` - Decisions ("Status change moves to `PATCH /api/suggestions/[id]/status`"):
  - return 401 / 403 / 400 / 404 for signed out, not admin, invalid status and unknown suggestion
  - update the status with the user-scoped client
  - use the service-role client to find the unsent notification, check `suggestion_updates` through `getEmailPreferences`, get the email, send it and set `email_sent_at`
  - log and swallow any email error
  - return `{ success, emailSent }`

  Verify, against local Supabase with no Resend key:
  - an admin status change on another user's suggestion logs the would-be email and sets `email_sent_at`
  - a non-admin call returns 403
  - with the author's `suggestion_updates` set to false, nothing is logged and `email_sent_at` stays null
  - for an author with no `email_preferences` row, the email is logged, because of the default

  (Implemented, and lint/typecheck pass. The route's runtime checks listed above need the Nuxt server running, so per CLAUDE.md they're part of the manual testing in 7.2 instead of being run here. The DB side it relies on - the trigger creating exactly one unsent status row, and the owner-only RLS - was verified in 1.2-1.4.)

## 3. Composables

- [x] 3.1 In `useSuggestions`:
  - switch `updateSuggestionStatus` to call the new PATCH route through `$fetch`, keeping the same signature
  - add `updateAdminComment(id, comment)`, which trims the text and sends `null` for empty
  - add `adminComment` / `adminCommentUpdatedAt` to `SuggestionListEntry`, the row type and `SUGGESTION_COLUMNS`
  - export shared `SUGGESTION_STATUS_LABEL` / `SUGGESTION_STATUS_COLOR` constants moved from `SuggestionList.vue`

  Verify: `pnpm run typecheck` passes.
- [x] 3.2 Create `app/composables/useNotifications.ts` with a `useState`-backed `unreadCount`, `fetchUnreadCount()` (head-only count, 0 when signed out), `fetchNotifications({ page, pageSize })` and `markAllRead()`, which also resets `unreadCount` to 0, per `design.md` - Decisions ("Unread state"). Verify: `pnpm run typecheck` passes.
- [x] 3.3 Create `app/composables/useEmailPreferences.ts` with:
  - `EmailPreferenceKey`, derived from the generated `email_preferences` row type
  - `EMAIL_PREFERENCE_OPTIONS`, starting with `suggestion_updates` / "Suggestion updates"
  - `preferences`, with defaults applied when no row exists
  - `fetchPreferences()`
  - `updatePreference(key, enabled)`, which upserts on `user_id` with only that column plus `updated_at`

  Verify: `pnpm run typecheck` passes.

## 4. Suggestion Box: admin response UI

- [x] 4.1 In `app/components/suggestion/List.vue`, update the accordion `#body` slot:
  - render the admin response block (label, icon, updated-at date, `NumberMotif` text) below the body when one exists
  - for admins, add a `UTextarea` (maxlength 1000, with a counter) and Save/Clear buttons that emit `update-comment`
  - add a message icon with a tooltip to the collapsed row when a response exists

  Verify: `pnpm run typecheck` and `pnpm run lint` pass.
- [x] 4.2 In `app/pages/suggestion-box.vue`, handle `update-comment` by calling `updateAdminComment` then `load()`, and show an error toast on failure. Verify: `pnpm run typecheck` passes.

## 5. Notification center and header

- [x] 5.1 Create `app/pages/notifications.vue` per `design.md` - Decisions ("Notification center page"):
  - default layout, SEO title
  - paginated list with 20 per page
  - per-type icon and text, status badge, response text, relative time
  - "new" highlight captured before `markAllRead()` runs on the client
  - `UEmpty` empty state

  Verify: `pnpm run typecheck` and `pnpm run lint` pass.
- [x] 5.2 Add `/notifications` to `isAuthGatedRoute` in `app/utils/authGatedRoutes.ts` and to the sitemap `exclude` list in `nuxt.config.ts`. Verify: both lists contain the route.
- [x] 5.3 In `app/components/core/AppHeader.vue`:
  - make `accountMenuItems` a `computed`
  - add a "Notifications" entry (`i-lucide-bell`, `/notifications`, unread count badge) in front of Settings in the second section
  - wrap the account button in `<UChip :show="unreadCount > 0" inset>`
  - call `fetchUnreadCount()` on mount, in the existing `watch(user)`, and on `route.path` changes

  Verify: `pnpm run typecheck` and `pnpm run lint` pass.

## 6. Settings and privacy policy

- [x] 6.1 Add an "Email notifications" section to `app/pages/settings.vue` that renders one `USwitch` per `EMAIL_PREFERENCE_OPTIONS` entry. Each switch is bound to `preferences[key]` and saved through `updatePreference`, with an error alert like the visibility toggle's. Verify: `pnpm run typecheck` and `pnpm run lint` pass, and the section shows exactly one "Suggestion updates" toggle.
- [x] 6.2 Update `app/pages/privacy-policy.vue` to name Resend as a processor that receives the author's email address when a suggestion status email is sent. Verify: the page text mentions Resend and contains no em dash.

## 6b. Live unread updates (added after initial implementation, per user request)

- [x] 6b.1 In the `add_suggestion_notifications` migration, add `alter publication supabase_realtime add table notifications;`. Apply that statement to local Supabase without a reset, since the migration is already applied there and hasn't been pushed to hosted. Verify: `select * from pg_publication_tables where pubname = 'supabase_realtime'` lists `notifications`.
- [x] 6b.2 Add `subscribeToUnread()` to `useNotifications`: one channel per user, listening for INSERT and UPDATE filtered on `user_id`, calling `fetchUnreadCount()` on each event, and returning an unsubscribe function, per `design.md` - Decisions ("Live unread updates"). Verify: `pnpm run typecheck` passes.
- [x] 6b.3 In `AppHeader.vue`, subscribe on mount, re-subscribe on user change (unsubscribing from the previous channel first), and unsubscribe on unmount. Keep the existing on-navigation refresh. Verify: `pnpm run typecheck` and `pnpm run lint` pass. (Also verified end to end against local Supabase with a throwaway signed-in user: the channel reached SUBSCRIBED, received INSERT and UPDATE events for its own notifications, and received nothing for another user's notification.)

- [x] 6b.4 Extend `subscribeToUnread()` with an `onNew` callback that receives each INSERT as a `NotificationEntry`. In `AppHeader.vue`, use it to show a toast (status change or admin response, suggestion title, "View" action to `/notifications`), per `design.md` - Decisions ("Live unread updates", toast on arrival). Verify: `pnpm run typecheck` and `pnpm run lint` pass.

## 7. End-to-end verification

- [x] 7.1 Run `pnpm run typecheck` and `pnpm run lint` across the change, and confirm there are no new errors beyond any that already exist on `develop`. (No new errors. Typecheck still reports the 4 errors that were already on `develop`, in `useBooks.ts` and `profile/[username]/compare.vue`. Lint still fails on 3 untouched `dark-tower` components, confirmed with `git stash` to fail on `develop` too.)
- [x] 7.2 Report ready for manual testing, and don't start the dev server. Use two local accounts, an admin and a regular user who owns a suggestion, and check:
  - a status change creates a notification and logs or sends the email
  - an admin response creates a notification with no email
  - the header dot and menu count appear live, without navigating, when the other account triggers a notification, and clear after opening `/notifications` (including in a second open tab)
  - a notification arriving while the app is open shows a toast, while reloading with unread notifications shows only the dot and count

  (Verified manually by the user.)
  - the email toggle suppresses only the email
  - deleting the suggestion removes its notifications
  - a non-admin sees the response but no edit control
- [ ] 7.3 Before release, run the pre-merge steps from `design.md` - Migration Plan:
  - verify the `king-library.com` sending domain in Resend
  - set `RESEND_API_KEY` / `EMAIL_FROM` in Vercel
  - push the migration to hosted Supabase, only after an explicit go-ahead

  Verify: the env vars are visible in the Vercel project settings and `supabase migration list` shows the migration applied remotely.

  (Archived with this task open, per user choice. The Resend domain is verified (already used for Supabase Auth SMTP), and `RESEND_API_KEY` / `EMAIL_FROM` are set in Vercel. Still to do: push the migration to hosted Supabase as the first release step, after an explicit go-ahead.)
