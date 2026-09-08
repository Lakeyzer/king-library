## 1. Database

- [x] 1.1 Write migration `create_user_book_editions_table` (table + `user_id`/`king_work_id`/`edition_id`/`edition_title`/`added_at` columns, unique `(user_id, edition_id)`) per `supabase-conventions`, and verify `supabase migration up` applies cleanly against local Supabase
- [x] 1.2 Add the four RLS policies (`readable by owner or if profile public`, `writable/updatable/deletable by owner only`) from `supabase-conventions`, and verify a second local user cannot insert/update/delete another user's edition rows (manual `supabase db` check or a quick RLS test query)
- [x] 1.3 Regenerate `app/types/database.types.ts` and verify `user_book_editions` appears with the expected columns

## 2. `useBookshelf()` composable

- [x] 2.1 Add `useBookshelf()` with `userEditionsByWorkId` state (map of `king_work_id` → `Set` of added `edition_id`s for the current user, same shape convention as `useBooks()`'s `userBooksByWorkId`) and `fetchUserEditions()` to populate it, and verify it populates after sign-in
- [x] 2.2 Implement `addEdition(workId, edition)`: insert the `user_book_editions` row, then upsert `user_books.owned = true`; verify both writes land and `userEditionsByWorkId`/`userBooksByWorkId` update reactively without a refetch
- [x] 2.3 Implement `removeEdition(workId, editionId)`: delete the row, then count remaining edition rows for that `(user, work)` and upsert `user_books.owned = false` only if none remain; verify via two manual cases (removing one of several editions leaves `owned` true; removing the last one flips it false)
- [x] 2.4 Implement `fetchBookshelf(userId)`: return every edition row plus every `user_books` row that is `owned` with no matching edition row, for use by the profile Bookshelf grid; verify it returns both kinds of entries against seeded local test data

## 3. Cover image helper

- [x] 3.1 Add `getEditionCoverUrl(editionId, size)` to `app/utils/coverImages.ts` (`https://covers.openlibrary.org/b/olid/{editionId}-{size}.jpg`) alongside a `getWorkCoverUrl(workKey, size)` helper that live-fetches the work's cover id from Open Library, and verify both render a real cover for a known edition/work

## 4. Edition add/remove control + vertical search

- [x] 4.1 Build a shared edition add/remove toggle (add icon when not in the collection, filled/remove state when it is), reading from `useBookshelf()`'s state, and verify clicking it calls `addEdition`/`removeEdition` and updates its own state immediately
- [x] 4.2 Add a search input to `EditionList.vue`'s vertical/paginated layout (currently only present in `orientation="auto"`'s horizontal layout), wired to the existing `loadAll()`-on-nonempty-query pattern, and verify entering a year or publisher filters the vertical list without a page reload
- [x] 4.3 Make vertical-mode pagination operate over the filtered in-memory list while a search term is active, and the normal server-paginated fetch otherwise, and verify both modes' pagination controls show correct totals
- [x] 4.4 Render the edition add/remove toggle on each row in both `EditionList.vue` layouts (horizontal cards and vertical list items), and verify a signed-in user can add/remove an edition directly from a work's on-page edition list
- [x] 4.5 Hide the toggle for signed-out visitors, and verify no add/remove control renders when signed out

## 5. Editions picker modal

- [x] 5.1 Build the editions picker as a `UModal` wrapping `WorkEditionList` with `orientation="vertical"`, and verify it opens showing the vertical layout regardless of viewport width
- [x] 5.2 Add the Open Library "add a missing edition" link (`https://openlibrary.org/books/add?work=/works/{workKey}`) to the modal footer, and verify it opens the correct Open Library page for the work
- [x] 5.3 Add an "Add to Shelf" item to `ReadingActions.vue`'s compact-mode dropdown menu that opens the picker, and verify it appears and opens the modal
- [x] 5.4 Add an "Add to Shelf" control to `ReadingActions.vue`'s expanded mode alongside the existing three controls, and verify it opens the same modal
- [x] 5.5 Verify neither control renders for a signed-out visitor (compact or expanded)

## 6. Profile Bookshelf

- [x] 6.1 Build a Bookshelf tile component (cover via `getEditionCoverUrl` for edition tiles, `getWorkCoverUrl` fallback for edition-less owned works, per the cover-resolution order in `supabase-conventions`), and verify both tile kinds render a cover
- [x] 6.2 Build the Bookshelf grid as round-robin columns (2 at the smallest breakpoint, 3 at `sm`, 5 at `lg`), computed client-side from `window.innerWidth` — replaced two earlier attempts (native `grid-template-rows: masonry`: no real browser support outside Firefox; `UPageColumns` CSS multi-column: balances by total height, reading as column-major/lopsided for a modest tile count rather than left-to-right) — replacing the "Coming soon" placeholder in `profile/Showcase.vue`, and verify column count and left-to-right fill order visually at each breakpoint in a browser
- [x] 6.3 Wire the grid to `useBookshelf().fetchBookshelf(profile.id)` from `pages/profile/[username].vue`, add an empty state for a profile with nothing in their collection, and verify both a populated and an empty collection render correctly
- [x] 6.4 Show the tile count next to the "Bookshelf" heading, and verify it matches the number of tiles rendered
- [x] 6.5 Update the Collection progress bar's `hint` prop (drop "Bookshelf coming soon" now that it exists), and verify the showcase no longer references an unbuilt feature

## 7. Documentation

- [x] 7.1 Update the `user_book_editions` section of `.claude/skills/supabase-conventions/SKILL.md` to reflect that removing a work's last edition now does flip `owned` back to `false` (superseding the previous "does not auto-flip" note), and verify the doc no longer contradicts the shipped behavior

## 8. Bookshelf follow-up fixes

- [x] 8.1 Add `openLibraryWorkKey` and `publishDate` to `BookshelfEditionItem` (and `publishDate` to `BookshelfWorkItem`), sourced from the `king_works` join `fetchBookshelf()` already performs, and verify both fields populate for a real edition and a real edition-less owned work
- [x] 8.2 Make an edition tile fall back to the work's live cover when its own edition has no cover art (confirmed real-world case: Open Library returns a 1x1 pixel GIF with `200 OK`, not a 404, for a cover-less edition id), falling back to the icon-and-title placeholder only if the work cover is also unavailable, and verify against a real edition known to have no cover art
- [x] 8.3 Add a search input (filters by King work title) and a sort control (title or release year, either direction) to the Bookshelf, placed together with the "Bookshelf" heading in one flex row, and verify searching narrows the shelf, sorting reorders it, and the heading count stays the full collection total regardless of the active search
- [x] 8.4 Default the Bookshelf's sort to release year (ascending), and verify a freshly loaded Bookshelf is sorted that way before any user interaction

## 9. Bookshelf tile removal

- [x] 9.1 Add `useBooks().setOwned(workId, owned)` as the shared write both `useBookshelf()` and any future caller use to flip ownership directly (already used internally by `addEdition`/`removeEdition`; verify it's exported and usable for a direct un-own with no edition involved)
- [x] 9.2 Add a remove control to each Bookshelf tile, shown only when viewing your own profile, and verify it's absent on another user's Bookshelf and present on your own
- [x] 9.3 Build a confirmation modal (`ProfileBookshelfRemoveModal`) that removes an edition tile via `removeEdition()` or an edition-less work tile via `setOwned(workId, false)`, and verify both paths work and that cancelling leaves the collection unchanged
- [x] 9.4 Remove the tile from the visible Bookshelf immediately on confirmed removal (without a full page reload), and verify the tile disappears and the heading count updates to match
- [x] 9.5 Change the remove button to `color="neutral"` and hide it until the tile is hovered or focused (`opacity-0`/`group-hover:opacity-100`/`focus-visible:opacity-100`), and verify it's invisible at rest but reachable via keyboard tab order

## 10. Add to Shelf label + owned-count stats

- [x] 10.1 Add a `shelfLabel` computed to `ReadingActions.vue` ("On Shelf" when owned, "Add to Shelf" otherwise) and use it everywhere the control's label appears (compact dropdown item, both expanded-mode buttons), and verify the label updates immediately after adding/removing an edition without a page reload
- [x] 10.2 Render `stats.owner_count` on the work detail page's stats row alongside the existing reading/want-to-read/read counts, and verify it shows the correct count for a work with known owners
- [x] 10.3 Add `booksOwnedCount` to `useHomepage()`'s `HomepageStats` (sum of `work_stats.owner_count`, extending the existing `work_stats` query rather than a new one) and a "Books Owned" tile to `StatsBar.vue`, and verify the homepage stats card shows a books-owned total consistent with the sum of individual work owner counts

## 11. Owned-unread recommendation

- [x] 11.1 Add `OwnedUnreadRecommendation` type and `fetchOwnedUnreadRecommendation(userId)` to `useBooks()` (one `user_books` query filtered to `owned = true, read = false`, random pick among candidates), and verify it returns a candidate for a user with an owned-unread book and `null` for a user with none
- [x] 11.2 Build `WorkOwnedRecommendation.vue` ("From Your Shelf" card, reusing `WorkTile`), and verify it renders nothing when `recommendation` is `null`
- [x] 11.3 Wire the new recommendation into the homepage (`pages/index.vue`), signed-in only, alongside the existing book/adaptation recommendations, and verify it appears for a signed-in user with an eligible book and is absent when signed out or with no eligible book
- [x] 11.4 Wire the new recommendation into the works browsing page sidebar (`works/index.vue`), same signed-in-only gating, and verify the same three cases
- [x] 11.5 Wire the new recommendation into the profile showcase (`Showcase.vue` + both profile pages), gated on `isOwner` like the existing two recommendations there, and verify it's shown on your own profile and absent on someone else's (public or private)

## 12. Edition list restyle + full-size cover preview

- [x] 12.1 Replace the vertical edition rows' `BibliographyListItem` cards with a compact `divide-y` list matching `WorkLeaderboard`'s row styling (no per-item card background), without changing `BibliographyListItem` itself or any page that reuses it, and verify the editions picker and the on-page list's small-screen fallback both show the new compact rows
- [x] 12.1a Size the row thumbnail per orientation - `xs` in the picker modal (`orientation="vertical"`), `sm` (matching `DetailConnectionList`'s own mobile fallback) on the on-page small-screen fallback (`orientation="auto"`) - and verify the on-page edition list no longer looks cramped next to the detail page's other connection lists at the same width, while the modal stays compact
- [x] 12.2 Add a full-size cover preview: clicking an edition's thumbnail (only when it has a cover) opens a `UModal` showing that cover at the `L` size, shared by both the horizontal and vertical layouts, and verify clicking a cover-less edition's thumbnail does nothing while a covered one opens the preview



