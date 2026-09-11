## 1. Database migrations (local first, per `supabase-conventions`)

- [x] 1.1 Create migration for the `avatars` Storage bucket + owner-scoped RLS policies (select/insert/update/delete) as described in design.md, apply locally with `supabase migration up`, and verify `supabase status`/Studio shows the bucket with the configured size limit and MIME-type allowlist
- [x] 1.2 Create migration adding `profiles.tagline` (nullable `text`) with the 50-character check constraint, apply locally, and verify a manual insert/update exceeding 50 characters is rejected by Postgres
- [x] 1.3 Create migration changing `profiles`'s username format constraint to allow mixed case, dropping the plain `unique` constraint, adding the generated `username_lower` column, and adding the case-insensitive unique constraint on it, apply locally, and verify existing local profile rows still pass (`select * from profiles` shows no errors, `username_lower` is populated for every row with a username)
- [x] 1.4 Verify locally that inserting two profiles with usernames differing only in case (e.g. `Foo`/`foo`) violates the new unique constraint
- [x] 1.5 Create migration for the `user_follows` table (columns, no-self-follow check, unique pair, RLS with the three follower-scoped policies) as described in design.md, apply locally, and verify a manual insert with `follower_id = followed_id` is rejected, a duplicate `(follower_id, followed_id)` pair is rejected, and a row is only selectable as the `follower_id` user

## 2. `useProfile()` composable

- [x] 2.1 Add `uploadAvatar(file: File)`: validates size/MIME type client-side, uploads to `avatars/{user.id}/...`, updates `profiles.avatar_url` with the public URL, and verify manually that uploading a valid image updates `profile.value.avatar_url`
- [x] 2.2 Add `updateTagline(tagline: string | null)` and verify it round-trips through `profiles.tagline`, including clearing it back to `null`
- [x] 2.3 Change `fetchProfileByUsername` to query `.eq('username_lower', username.toLowerCase())` instead of `.eq('username', username)`, and verify `/profile/SomeUser` and `/profile/someuser` both resolve the same profile locally
- [x] 2.4 Add `checkUsernameAvailable(username: string)` returning a boolean via the same `username_lower` lookup, and verify it returns `false` for a taken name (any case) and `true` for a free one

## 3. `useIdentities()` composable

- [x] 3.1 Add `linkEmailPassword(password: string)` calling `supabase.auth.updateUser({ password })` then refreshing `fetchIdentities()`, and verify manually on a local Google-only test account that an `email` identity appears afterward

## 4. Onboarding page (`app/pages/onboarding.vue`)

- [x] 4.1 Update `USERNAME_PATTERN` to allow uppercase letters and update the validation error copy to match
- [x] 4.2 Add a debounced (~400ms) live availability check on the username input using `checkUsernameAvailable`, showing a taken/available indication before submit, and verify by typing an existing local username and seeing the indicator flip
- [x] 4.3 Verify submitting a username that differs only in case from an existing one is still rejected with the existing "already taken" error copy (via the `23505` catch path)

## 5. Settings page — avatar and tagline (`app/pages/settings.vue`)

- [x] 5.1 Add an avatar upload control (file input behind a `UAvatar`/button) wired to `uploadAvatar`, showing a loading state and an error alert on rejection, and verify uploading and replacing an avatar updates the displayed image
- [x] 5.2 Add a tagline `UFormField`/`UInput` (max 50, with a character counter) wired to `updateTagline`, and verify saving, clearing, and the over-limit case (client-side block, matching the DB constraint)

## 6. Settings page — delete confirmation modal (`app/pages/settings.vue`)

- [x] 6.1 Move the existing type-"DELETE"-to-confirm block into a `UModal`, add the quote "Go then, there are other apps than these." inside it, and verify the existing confirm/cancel/error behavior is unchanged, just presented in the modal
- [x] 6.2 Verify closing the modal without confirming leaves the account intact (existing `cancelDelete` behavior, re-verified in the new modal presentation)

## 7. Settings page — email/password linking modal (`app/pages/settings.vue`)

- [x] 7.1 Add a "Link email/password" button, shown only when `identities` has no `provider === 'email'` entry, alongside the existing OAuth link buttons
- [x] 7.2 Build the link modal: read-only display of the account's current email, password + confirm-password fields, calls `linkEmailPassword`, and verify on a local OAuth-only test account that the new identity appears in the linked-identities list afterward without signing the user out
- [x] 7.3 Verify the error path (e.g. a weak/rejected password) shows an error in the modal without closing it or losing entered state unexpectedly

## 8. Showcase (`app/components/profile/Showcase.vue`)

- [x] 8.1 Add a `tagline` prop and render it in place of the static "Stephen King reading showcase" subtitle when set, falling back to the static text when not, and verify both states render correctly
- [x] 8.2 Pass `profile.tagline` through from `app/pages/profile/[username].vue` and `app/pages/profile/index.vue` (if it separately fetches the owner's own profile) into `Showcase`
- [x] 8.3 Lowercase the username when building the shareable URL in `shareProfile()`, and verify the copied/shared link is lowercase even when the profile's stored username has capitals
- [x] 8.4 Replace the disabled "Coming soon" follow button with a live control backed by `isFollowing`/`follow`/`unfollow`, routing a signed-out visitor's click to `useAuthModal().open()` instead of following, and verify follow/unfollow toggles correctly for a signed-in visitor and the signed-out click opens the sign-in modal

## 9. `useFollowing()` composable

- [x] 9.1 Add `fetchFollowing(userId?)` (profiles the given user, defaulting to the signed-in user, follows) and verify it returns the right profiles for a local test account with a few follows
- [x] 9.2 Add `isFollowing(profileId)`, `follow(profileId)`, and `unfollow(profileId)`, and verify follow/unfollow correctly insert/delete the `user_follows` row and `isFollowing` reflects the change
- [x] 9.3 Add `fetchFollowingCurrentlyReading()` (followed profiles + a `.in('user_id', followedIds).eq('currently_reading', true)` query on `user_books`, grouped client-side by user), and verify a followed user who is currently reading something appears in the result and a followed-but-private user's reading data does not (RLS-filtered)

## 10. Header and routing

- [x] 10.1 Add a "Following" entry to `AppHeader.vue`'s `accountMenuItems`, linking to `/following`, and verify it appears in the account dropdown for a signed-in user
- [x] 10.2 Add `/following` to the sign-in-gated paths in `app/middleware/onboarding.global.ts`, and verify a signed-out visitor navigating to `/following` is redirected the same way `/profile`/`/settings` already are

## 11. `/following` page (`app/pages/following.vue`)

- [x] 11.1 Create the page using the detail layout (`definePageMeta({ layout: 'detail' })`), main area listing `fetchFollowing()`'s results (avatar, username, link to their showcase) with an empty state when the list is empty
- [x] 11.2 Add the sidebar using `fetchFollowingCurrentlyReading()`, one block per followed user with at least one currently-reading work, omitting followed users with nothing to show, with an empty state when no followed user has anything currently reading
- [x] 11.3 Verify on a narrow viewport that the main list and sidebar stack per the existing detail-layout behavior rather than requiring horizontal scrolling

## 12. Manual verification pass

- [x] 12.1 Walk through every scenario listed in `specs/user-profile/spec.md`, `specs/user-onboarding/spec.md`, `specs/profile-showcase/spec.md`, `specs/user-following/spec.md`, and `specs/app-shell/spec.md` against the running local app and confirm each holds
