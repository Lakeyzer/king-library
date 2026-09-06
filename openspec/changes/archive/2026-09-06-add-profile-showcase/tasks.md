## 1. Move account settings to `/settings`

- [x] 1.1 Create `app/pages/settings.vue` with the current contents of `app/pages/profile.vue` (identities, visibility toggle, delete account), rewording on-page copy from "Profile" to "Settings" and verify `/settings` renders identically to the old `/profile` page for a signed-in user
- [x] 1.2 Update the OAuth link redirect in the settings page from `next=/profile` to `next=/settings` and verify linking a provider returns to `/settings`
- [x] 1.3 Delete `app/pages/profile.vue` (superseded by `app/pages/profile/index.vue` in section 3) and verify no remaining reference to the old single-file route

## 2. Data layer for progress stats and public profile lookup

- [x] 2.1 Add `fetchProfileByUsername(username)` to `useProfile` (selects the existing profile columns by `username`, returns `null` when no match) and verify it returns the correct profile for a known username and `null` for an unknown one
- [x] 2.2 Add a composable function (e.g. `useProfileStats` or an addition to `useBooks`) that, given a user id, returns overall/Bachman/Dark-Tower read counts and totals plus owned count and total, derived from `fetchKingWorks()` and that user's `user_books` rows, and verify the counts match manually-checked totals for a seeded test account
- [x] 2.3 Add a composable function that, given a user id, returns watched count and total adaptations, derived from `fetchAdaptations()` and that user's `user_adaptations` rows, and verify the counts match a seeded test account
- [x] 2.4 Add a composable function that, given a user id, returns the list of currently-reading King works (with cover ids) ordered by most recently started first, and verify ordering with multiple currently-reading rows

## 3. Own showcase page (`/profile`)

- [x] 3.1 Create `app/pages/profile/index.vue`, gated the same way the old profile page was (redirect signed-out visitors to sign in; redirect users without a username to onboarding), and verify both redirects still fire
- [x] 3.2 Wire the page to the section 2 composables using the signed-in user's own id and verify the dashboard renders real data for a signed-in test account

## 4. Public showcase page (`/profile/[username]`)

- [x] 4.1 Create `app/pages/profile/[username].vue` that resolves the username via `fetchProfileByUsername`, shows a not-found state when no profile matches, and verify both the found and not-found cases
- [x] 4.2 Render the private-profile notice when the resolved profile's `is_public` is false and the viewer is not its owner, and verify a signed-out visitor and a different signed-in user both see the notice while the owner sees the full dashboard
- [x] 4.3 Wire the page to the section 2 composables using the resolved profile's id and verify a public profile's dashboard renders for a signed-out visitor

## 5. Dashboard UI

- [x] 5.1 Build the shared dashboard component/layout consumed by both pages in sections 3 and 4 (progress bars for overall/Bachman/Dark Tower, adaptation viewing progress, Currently Reading cover strip, collection progress), using Nuxt UI progress/card components per `nuxt-conventions`, and verify it renders correctly with a populated test account
- [x] 5.2 Implement the Currently Reading section as a horizontal strip/carousel of cover art (reusing `ImageThumbnail`-style cover rendering) with an empty state when nothing is currently reading, and verify both the multi-item and empty cases visually
- [x] 5.3 Make the collection-progress indicator visually present but non-navigating (no link, no click handler) and verify it does not attempt to route anywhere when activated

## 6. Navigation updates

- [x] 6.1 Update `AppHeader.vue`'s account dropdown to add a "Settings" entry linking to `/settings` alongside the existing "Profile" entry (now pointing at the showcase) and verify both entries navigate correctly for a signed-in user

## 7. Manual verification

- [x] 7.1 Walk through: sign in → visit `/profile` (own showcase) → visit `/settings` (settings) → sign out → visit another user's `/profile/[username]` while public → toggle that account private → confirm the private notice appears to a different signed-in user

## 8. Currently Reading refinements

- [x] 8.1 Reposition the Currently Reading section to the top-right of the dashboard, aligned with the header row (avatar/username), and verify the layout on both narrow and wide viewports
- [x] 8.2 Reduce the cover art size and drop the title caption in the Currently Reading strip, and verify visually
- [x] 8.3 Add a "Finish" action to each Currently Reading item that opens `BookFinishReadingModal` for that work, shown only to the profile owner, and verify finishing updates the work's read state and removes it from the strip
- [x] 8.4 Change the Dark Tower progress bar's icon from `i-lucide-tornado` to `i-lucide-castle`, and verify it renders
