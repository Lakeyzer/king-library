## 1. Data layer

- [x] 1.1 Add a `fetchReadList(userId)` fetcher to `composables/useBooks.ts` returning every King work the given user has marked `want_to_read` (as a `ReadListEntry`, with `type` included for the browsing layout's type filter), and verify it returns an empty array for a user with none queued
- [x] 1.2 Add a `fetchWatchList(userId)` fetcher to `composables/useAdaptations.ts` returning every adaptation the given user has marked `want_to_watch` (as a `WatchListEntry`, with `type` and `releaseYear` included), and verify it returns an empty array for a user with none queued
- [x] 1.3 Add a `fetchGiftIdeaRecommendation(userId)` fetcher to `composables/useBooks.ts` returning one King work where `want_to_read = true AND owned = false` for the given user (or null when none exists), not gated to the calling user's own id, and verify it returns null when no eligible work exists

## 2. Shared browsing layout

- [x] 2.1 Add optional `emptyIcon`/`emptyTitle`/`emptyDescription` props to `app/components/BibliographyBrowsePage.vue` and a two-tier empty state (genuinely-empty `items` vs filtered-to-nothing, mirroring `ProfileBookshelf`'s split), plus an optional `showSort` prop (default `true`) hiding the sort controls, and verify `/works` and `/adaptations` still render unchanged (new props omitted, so defaults apply) and a page passing `items: []` shows the tailored empty state instead of a blank list

## 3. Shared profile-route context

- [x] 3.1 Add `ViewedProfileContext`, `viewedProfileKey`, and `useViewedProfile()` to `composables/useProfile.ts` for a tab-content component to read (via `inject()`) whatever its page `provide()`s, and verify calling `useViewedProfile()` outside that context throws a clear error
- [x] 3.2 Add a synchronous `provideViewedProfile(profile)` to `composables/useProfile.ts`, computing `isOwner`/`isPrivate` against the current visitor and `provide()`-ing the context - called directly from each leaf page's own setup right after that page resolves its own `Profile` (own-shortcut: already-loaded, no fetch; by-username: the page's own `await useAsyncData(...)` + 404), never from inside an async composable that does its own internal fetch-then-provide (that was tried first and broke `provide()` for the by-username routes - see nuxt-conventions "`provide()` after your own composable's internal `await` doesn't reliably work"), and verify a nonexistent username 404s and a private profile viewed by a non-owner computes `isPrivate: true`

## 4. Profile page: shared header, tabs, and six independent leaf routes

- [x] 4.1 Build this as six independent leaf pages sharing a plain (non-route) chrome component, not Nuxt nested routing (`[param].vue` + `<NuxtPage />`) - that was tried first: making `profile.vue` a real nested-routes parent for `/profile`'s own tabs also made it parent `profile/[username].vue`, since that file lives inside the same `profile/` directory `profile.vue` owns, so visiting someone else's profile rendered both the visitor's own header *and* the viewed profile's header stacked together. See `nuxt-conventions` "A page file can't share a name with a sibling directory - even to share layout chrome" for the full writeup; verify no `app/pages/profile.vue` or `app/pages/profile/[username].vue` file exists and no profile page renders `<NuxtPage />`
- [x] 4.2 Extract `app/components/profile/Header.vue` (avatar, username, tagline, share-or-follow control) out of `Showcase.vue`, and verify it renders and behaves identically to before (share for a public owner, "Private" badge for a private owner, follow/unfollow for a non-owner visitor)
- [x] 4.3 Add `app/components/profile/Tabs.vue`: three route-linked tabs (Reader Checklist, Read List, Watch List) built from a `basePath` prop, using `UNavigationMenu` with `highlight` (not `UTabs`, which is local-state/`v-model`-only and has no link concept), and verify the active tab highlights correctly for each of the three routes and only for the current one
- [x] 4.4 Add `app/components/profile/RouteChrome.vue`: a plain, non-async component taking an already-resolved `profile`/`isOwner`/`isPrivate`/`basePath` as props, rendering `Header` + (private notice, or `Tabs` + a default slot for the page's tab content)
- [x] 4.5 Add `app/components/profile/ReaderChecklistTab.vue`: fetches this tab's own data via `useViewedProfile()`'s resolved profile, renders `ProfileShowcase` (header-less now)
- [x] 4.6 Rewrite the six leaf pages (`app/pages/profile/index.vue`, `read-list.vue`, `watch-list.vue`, `app/pages/profile/[username]/index.vue`, `read-list.vue`, `watch-list.vue`) to each call the matching resolver composable (3.2) and render `RouteChrome` wrapping their tab's content component, and verify `/profile`, `/profile/read-list`, `/profile/watch-list` all show the same header with the correct tab highlighted, and that viewing another user's profile shows **only their** header, never your own alongside it

## 5. Read List / Watch List tabs

- [x] 5.1 Add `app/components/profile/ReadListTab.vue`: resolves `profile`/`isOwner` via `useViewedProfile()`, fetches via `fetchReadList`, renders through `BibliographyBrowsePage` with tailored own-vs-others title/empty-state text, each item showing `BookReadingActions`
- [x] 5.2 Add `app/components/profile/WatchListTab.vue`, same pattern for `fetchWatchList` and `AdaptationWatchActions`
- [x] 5.3 Verify all six leaf pages render correctly, including the populated and empty states on both list tabs
- [x] 5.4 Verify `BookReadingActions`/`AdaptationWatchActions` on someone else's Read List/Watch List tab act on the *viewer's own* status for each item (same as every other bibliography-browsing page), not the profile owner's

## 6. Header account menu

- [x] 6.1 Restructure `accountMenuItems` in `app/components/core/AppHeader.vue` from a flat array into a grouped `DropdownMenuItem[][]` (profile-and-lists section: Profile, Read List, Watch List, Following; settings section: Settings; sign-out section: Sign out), and verify the rendered `UDropdownMenu` shows three sections separated by dividers
- [x] 6.2 Point the Read List and Watch List entries at `/profile/read-list` and `/profile/watch-list`, and verify activating each entry navigates to the corresponding tab
- [x] 6.3 Update `app/middleware/onboarding.global.ts`'s sign-in gate list to `/profile/read-list` and `/profile/watch-list` in place of the earlier standalone routes, and verify a signed-out visit to either redirects to sign-in

## 7. Gift-idea recommendation on the Reader Checklist tab

- [x] 7.1 Add a gift-idea recommendation card component (modeled on `app/components/work/OwnedRecommendation.vue`) displaying a `WorkTile` (reading actions hidden, since it's someone else's book) with the meta text "It's on their read list, but not their shelf"
- [x] 7.2 Wire the card into `app/components/profile/Showcase.vue`'s non-owner branch, fetching via `fetchGiftIdeaRecommendation(profileId)` (not gated by `isOwner`), and verify it renders for a non-owner visitor when an eligible work exists
- [x] 7.3 Verify the card renders nothing (no empty state) when no eligible work exists, and verify it never renders when the viewer is the profile owner, per the `profile-showcase` spec scenarios

## 8. Verification

- [ ] 8.1 Manually walk through: sign in, visit all three own tabs and confirm the header stays in place while tab content and the active tab indicator change; confirm the browsing layout (search/sort/type-filter/cover thumbnails) works on both list tabs and the empty state shows correctly for an empty list; open the account menu and confirm grouping/dividers and working links; view another public profile, click through its three tabs, and confirm a private profile shows only the header and private notice; confirm the gift-idea recommendation and its copy appear where expected
