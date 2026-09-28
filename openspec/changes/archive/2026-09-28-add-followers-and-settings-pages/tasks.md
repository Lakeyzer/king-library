## 1. Database

- [x] 1.1 Create migration `add_followers_and_follow_notifications` (`supabase migration new`). In it, drop `"user_follows readable by follower"` and create `"user_follows readable by follower or followed"` (`to authenticated`, `(select auth.uid()) in (follower_id, followed_id)`). Add `user_follows_followed_created_idx` on `(followed_id, created_at desc)`, per `design.md` - Decisions ("`user_follows`: one combined select policy"). Verify with local SQL as user A:
  - rows where A follows someone are returned
  - rows where someone follows A are returned
  - rows between two other users are not
- [x] 1.2 In the same migration, generalize `notifications`, per `design.md` - Decisions ("`notifications` generalized"):
  - drop `not null` on `suggestion_id` / `suggestion_title`
  - add `actor_id uuid references profiles (id) on delete cascade`
  - replace `notifications_type_valid` so it includes `new_follower`
  - add `notifications_subject_valid`
  - add `notifications_actor_idx`

  Verify: `supabase migration up` applies cleanly against a DB that already has suggestion notifications, and inserting a `new_follower` row without `actor_id` fails the check.
- [x] 1.3 In the same migration, add `notify_on_follow()` (`security definer`, `set search_path = ''`) and an `after insert on user_follows` trigger. It inserts a `new_follower` row for `followed_id` with `actor_id = follower_id`, unless the same pair already has a `new_follower` row from the last 24 hours, per `design.md` - Decisions ("Notification created by a trigger on `user_follows`"). Verify with local SQL:
  - a follow creates one notification
  - unfollow and follow again creates none
  - after backdating the existing row's `created_at` by 25 hours, following again creates one more
  - deleting the follower's profile or auth user removes the notification
- [x] 1.4 In the same migration, add `email_preferences.new_followers boolean not null default true`. Verify: an existing row with `suggestion_updates = false` now reads `new_followers = true`.
- [x] 1.5 Apply locally with `supabase migration up` (never `db reset`) and regenerate `app/types/database.types.ts`. Verify: the file contains `notifications.actor_id`, nullable `suggestion_id` / `suggestion_title`, and `email_preferences.new_followers`.

## 2. Server: follow route and email

- [x] 2.1 Move `escapeHtml` from `server/utils/suggestionStatusEmail.ts` into `server/utils/escapeHtml.ts` and import it there. Change the status email's settings link and footer copy to point at `/settings/notifications`. Verify: `pnpm typecheck` passes, and the built email text contains `/settings/notifications`.
- [x] 2.2 Add `new_followers` to `EmailPreferences`, `DEFAULT_EMAIL_PREFERENCES` and the select list in `server/utils/emailPreferences.ts`. Verify: `pnpm typecheck` passes.
- [x] 2.3 Create `server/utils/newFollowerEmail.ts` (`buildNewFollowerEmail({ to, followerUsername, origin })`), per `design.md` - Decisions ("New follower email"). It links to `/following?tab=followers` and to "New followers" in `/settings/notifications`, and HTML-escapes the username. Verify: `pnpm lint` passes and the output contains no em dash.
- [x] 2.4 Create `server/api/follows.post.ts` following the numbered flow in `design.md` - Decisions ("Follow moves to `POST /api/follows`"). Verify, against local Supabase with no Resend key:
  - signed out returns 401
  - an invalid body returns 400
  - a self-follow returns 400
  - a first follow inserts the row, logs the would-be email and stamps `email_sent_at`
  - following again when already following returns success without a second row
  - unfollow and follow again within 24h sends no email
  - with `new_followers = false`, nothing is logged but the notification exists

## 3. Composables

- [x] 3.1 In `useFollowing`, per `design.md` - Decisions ("`useFollowing`: paginated fetchers"):
  - replace `fetchFollowing()` with paginated `fetchFollowing({ page, pageSize })`
  - add `fetchFollowers({ page, pageSize })` and `fetchFollowingIds()`
  - switch `fetchFollowingCurrentlyReading()` to use the full id set
  - make `follow()` call `POST /api/follows`

  Verify: `pnpm typecheck` passes, and the follow button on a profile still toggles and creates the notification.
- [x] 3.2 In `useNotifications`, turn `NotificationEntry` into a discriminated union with a `new_follower` variant carrying `actor`. Embed `actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)` in `fetchNotifications`. In `subscribeToUnread`'s `onNew`, resolve the actor profile for `new_follower` rows before calling back, per `design.md` - Decisions ("Realtime toast resolves the actor"). Verify: `pnpm typecheck` passes.
- [x] 3.3 In `useEmailPreferences`:
  - select `'*'` and keep only the boolean keys
  - add `new_followers: true` to `DEFAULT_EMAIL_PREFERENCES`
  - add the "New followers" entry to `EMAIL_PREFERENCE_OPTIONS`

  Verify: `pnpm typecheck` passes.

## 4. /following page

- [x] 4.1 Consult `nuxt-conventions`, then create the follow-list component (`app/components/following/UserList.vue` or whatever the conventions dictate). It renders `UUser` rows (avatar with `i-lucide-user` fallback, `NumberMotif` username/tagline, profile link), an `#actions` slot, `UEmpty`, and `UPagination` only when `total > 15`, per `design.md` - Decisions ("`/following` page"). Verify: `pnpm lint` and `pnpm typecheck` pass.
- [x] 4.2 Rework `app/pages/following.vue`:
  - `UTabs` (Following / Followers) synced to `?tab=`
  - a separate `page` ref and `useAsyncData` per tab, with a page size of 15
  - Compare on every row
  - Follow back or a "Following" badge on follower rows, using `fetchFollowingIds()`
  - after a follow back, refresh the following list and the sidebar
  - the Currently reading aside unchanged

  Verify manually:
  - `/following?tab=followers` opens that tab
  - 16+ followers show pagination
  - Follow back swaps to "Following" and the user appears on the Following tab

## 5. Settings pages

- [x] 5.1 Turn `app/pages/settings.vue` into the parent route: `UPage` with `#left` `UPageAside`, a vertical `UNavigationMenu` (Profile / Account / Notifications), a `lg:hidden` horizontal copy above `<NuxtPage />`, and add `app/pages/settings/index.vue` that redirects to `/settings/profile`, per `design.md` - Decisions ("Settings: nested route"). Verify: `/settings` lands on `/settings/profile` with the aside visible on desktop and the top navigation on mobile width.
- [x] 5.2 Create `app/pages/settings/profile.vue` with the avatar upload (plus a `UAvatar` preview), tagline and public profile toggle, moving their logic unchanged from the old page, with its own `setPageSeo`. Verify manually: an avatar upload, a tagline save and the visibility toggle all work.
- [x] 5.3 Create `app/pages/settings/account.vue` with the username/email summary, sign-in methods (link/unlink, `LinkEmailPasswordModal`) and delete account (`DeleteAccountModal`). Change the OAuth link return URL to `/confirm?next=/settings/account`. Verify manually: linking Google or Discord returns to `/settings/account`, and the delete modal opens.
- [x] 5.4 Create `app/pages/settings/notifications.vue` with the email settings section, looping over `EMAIL_PREFERENCE_OPTIONS`. Verify manually: both toggles show as on by default, and toggling "New followers" persists across a reload.
- [x] 5.5 Change `isAuthGatedRoute()` to also match `path.startsWith('/settings/')`, and add `'/settings/**'` to the sitemap `exclude` in `nuxt.config.ts`. Verify:
  - signed out, visiting `/settings/account` directs to sign-in
  - signing out on `/settings/notifications` navigates away

## 6. Notification center and toast

- [x] 6.1 Update `app/pages/notifications.vue`:
  - render `new_follower` entries (`i-lucide-user-plus` icon, `UUser` or an avatar + username link to the follower's profile, "started following you")
  - generalize the subtitle and empty-state copy to cover suggestions and followers

  Verify manually: a follow from a second account shows up correctly and links to that profile.
- [x] 6.2 Update the `AppHeader.vue` toast for `new_follower` ("<username> started following you", with a fallback when the actor can't be resolved), keeping the View action. Verify manually: with two browsers, following user B while B has the app open shows B the toast, and the unread dot updates.

## 7. Wrap-up

- [x] 7.1 Run `pnpm lint` and `pnpm typecheck`, and grep the change's files for the em dash character (U+2014). Verify: all clean.
- [x] 7.2 Update the `supabase-conventions` skill so it covers the new `user_follows` policy, the `notifications.actor_id` / `new_follower` type and `email_preferences.new_followers`. Verify: the skill describes the new columns and policy.
- [x] 7.3 Note for archive: update the `notifications` main spec's Purpose to cover follower notifications (it currently says suggestions only). Verify: done during `/opsx:archive`.
- [x] 7.4 Report what's ready for manual testing (do not start the dev server). Point out that at release the migration must be pushed to hosted after `20260927121027_add_suggestion_notifications.sql`, with an explicit go-ahead.
