## Why

Following is one-way right now: you can see who you follow, but not who follows you, and nothing tells you when someone new starts following you. Meanwhile the single settings page has grown to hold profile, sign-in, visibility, email and deletion settings in one long column, and adding a new email toggle there would make it longer still.

## What Changes

- `/following` gets two tabs in its main column: **Following** (who you follow) and **Followers** (who follows you). Each tab is paginated at 15 users per page, newest follow first. The "Currently reading" sidebar is unchanged.
- Both lists render each user with Nuxt UI's `UUser` component (avatar, username, tagline) instead of the current hand-built row. Following rows keep the Compare button. Follower rows get a Compare button and a "Follow back" button when you don't follow that user yet.
- When someone starts following you, you get an in-app notification (in the notification center, the header's unread indicator, and a live toast). It names the follower and links to their profile.
- You also get an email about a new follower unless you turn off the new **"New followers"** email setting. Unfollowing and following again within 24 hours does not create another notification or email.
- Following a user moves from a direct client insert to a server route, so the email can be sent after the follow is saved. The email is best-effort: a failed email never fails the follow.
- **BREAKING (URL)**: `/settings` is split into three pages, with a `UPageAside` navigation on the left (a compact navigation above the content on small screens):
  - `/settings/profile`: avatar upload, tagline, public profile toggle
  - `/settings/account`: account details, sign-in methods, delete account
  - `/settings/notifications`: email settings, now with "Suggestion updates" and "New followers"
  - `/settings` redirects to `/settings/profile`, so existing links and the header's Settings entry keep working. Links in emails and the OAuth link-provider return URL point at the new sub-pages.
- The notification center's heading copy and empty state are generalized, since notifications are no longer only about suggestions.

## Capabilities

### New Capabilities

_None._ Followers extend `user-following`, the follower notification extends `notifications`, and the settings split changes where `user-profile` requirements live.

### Modified Capabilities

- `user-following`: `/following` gains a Followers tab, both lists become paginated (15 per page) and use the `UUser` presentation, follower rows offer Follow back and Compare, and a user can see who follows them (but never another user's followers).
- `notifications`: new "someone started following you" notification type, its toast, its email and the "New followers" email toggle; notification center copy covers more than suggestions; the email settings section moves to `/settings/notifications`.
- `user-profile`: the account settings page becomes three pages (Profile, Account, Notifications) with side navigation, and each existing settings requirement is scoped to the page it now lives on.

## Impact

- **Database** (one new migration):
  - `user_follows`: add a select policy so the followed user can read rows where they are `followed_id`.
  - `notifications`: add a `new_follower` type and an `actor_id` column (references `profiles`, cascade on delete); make `suggestion_id` and `suggestion_title` nullable, with a check constraint enforcing the right columns per type.
  - New trigger on `user_follows` insert creates the notification, with 24-hour de-duplication per follower.
  - `email_preferences`: add `new_followers boolean not null default true`.
- **Server**:
  - New `POST /api/follows` route: user-scoped insert, then a best-effort email via the service role.
  - New `server/utils/newFollowerEmail.ts`.
  - `server/utils/emailPreferences.ts` gains the new key.
  - The suggestion status email's settings link moves to `/settings/notifications`.
- **Composables**:
  - `useFollowing`: paginated `fetchFollowing` / `fetchFollowers`, `fetchFollowingIds` for the sidebar and follow-back state, and `follow` calls the server route.
  - `useNotifications`: an actor profile on each entry.
  - `useEmailPreferences`: the new option, and its select no longer hard-codes columns.
- **Pages/components**:
  - `app/pages/following.vue`
  - `app/pages/settings.vue`, which becomes the parent route with `UPageAside`
  - new `app/pages/settings/{index,profile,account,notifications}.vue`
  - `app/pages/notifications.vue`
  - `AppHeader.vue` for the follower toast
  - `app/utils/authGatedRoutes.ts` to gate `/settings/*`
  - `nuxt.config.ts` to exclude `/settings/**` from the sitemap
- **Types**: regenerate `app/types/database.types.ts`.
- **Release**: the migration must be pushed to hosted Supabase before merging to `main`.
