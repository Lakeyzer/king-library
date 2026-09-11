## Why

The settings page has lagged behind the rest of the app: there's no way to personalize a profile with a photo or a short tagline, account deletion is a bare inline text-match with no real friction or personality, an OAuth-only user can't add a password as a backup sign-in method, and usernames are locked to lowercase with no feedback on whether a name is already taken until after submitting. This change closes those gaps in one pass since they all live on the same page and touch the same `profiles` row. It also adds follow functionality — the Showcase already has an unwired "Follow" button stubbed as "Coming soon" — so users can keep track of who they follow and what those users are currently reading.

## What Changes

- Add avatar upload: a signed-in user can upload a small profile image, stored in Supabase Storage, replacing the existing empty `UAvatar` fallback on Settings and on the Showcase.
- Add a tagline/motto field (max 50 characters, optional) editable from Settings. When set, it replaces the static "Stephen King reading showcase" subtitle on the profile Showcase; when unset, the Showcase falls back to the current static text.
- Move account deletion confirmation into a `UModal`, keeping the existing type-to-confirm safeguard, and add the quote "Go then, there are other apps than these." to the modal.
- Add email/password as a linkable sign-in method from Settings, alongside the existing Google/Discord linking, collected via a modal (email + password fields) rather than an OAuth redirect, so an OAuth-only account can add a password as a backup sign-in method.
- Allow capital letters in usernames (currently restricted to lowercase only), enforce uniqueness case-insensitively so `JohnDoe` and `johndoe` can't both be taken, and show live "already taken" feedback as the user types on the onboarding username field. The stored username keeps its chosen casing for display (e.g. `@JohnDoe`), but `/profile/[username]` URLs the app generates always use the lowercase form, and the profile route resolves a username case-insensitively so any casing of a valid username still reaches the right profile.
- Add follow functionality: a signed-in user can follow/unfollow another user from that user's Showcase (wiring up the existing disabled "Follow" button), a "Following" entry is added to the account dropdown menu, and a new `/following` page shows an overview of who the signed-in user follows with a sidebar of what those followed users are currently reading (when anything).

## Capabilities

### New Capabilities

- `user-following`: follow/unfollow relationships between users, and the `/following` page (overview of who you follow, plus a sidebar of their currently-reading works).

### Modified Capabilities

- `user-profile`: adds avatar upload, adds the tagline field, moves delete confirmation into a modal with the quote, adds email/password as a linkable sign-in identity.
- `user-onboarding`: allows capital letters in usernames with case-insensitive uniqueness, adds live availability feedback while typing a username.
- `profile-showcase`: shows the tagline in place of the static subtitle when one is set, uses the lowercase form of the username when building the profile's shareable URL, and adds a working follow/unfollow control for non-owner visitors in place of the current disabled "Coming soon" button.
- `app-shell`: adds a "Following" entry to the signed-in account menu, linking to `/following`.

## Impact

- **Database**: `profiles` gains a `tagline` column (nullable, ≤50 chars); `avatar_url` already exists but is currently unused by any write path. `username`'s format constraint changes to allow mixed case, and its uniqueness constraint becomes case-insensitive (a functional unique index on `lower(username)` rather than a plain unique constraint). New Supabase Storage bucket for avatars, with RLS-equivalent storage policies restricting writes to the owning user and a small file-size/MIME-type limit. New `user_follows` table (`follower_id`, `followed_id`) with RLS scoped to the follower.
- **Code**: `app/pages/settings.vue` (avatar upload, tagline field, delete modal, email/password link modal), `app/pages/onboarding.vue` (capitalized usernames, live availability check), `app/composables/useProfile.ts` (avatar upload/removal, tagline update, case-insensitive username lookup/availability check), `app/composables/useIdentities.ts` (email/password as a `LinkableProvider`), `app/components/profile/Showcase.vue` (tagline display, lowercase share URL, working follow control), `app/components/core/AppHeader.vue` (Following menu entry), `app/middleware/onboarding.global.ts` (gate `/following` behind sign-in), new `app/composables/useFollowing.ts`, new `app/pages/following.vue`.
- **No breaking changes**: existing lowercase usernames remain valid under the relaxed format constraint; the case-insensitive uniqueness index doesn't conflict with any existing data since all current usernames are already lowercase.
