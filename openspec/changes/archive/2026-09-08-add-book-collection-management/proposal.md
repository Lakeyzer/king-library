## Why

Users can already mark a King work `owned` at the database level (`user_books.owned`), and Open Library edition data is already fetched and displayed read-only via `WorkEditionList`, but there is no way for a user to actually add a book to their collection from the UI. The profile showcase's Collection progress bar and Bookshelf section are both explicit placeholders today ("Bookshelf coming soon"). This change wires up the missing write path — adding/removing specific editions — and replaces the Bookshelf placeholder with a real, working shelf.

## What Changes

- Add a `user_book_editions` table (schema already specified in `supabase-conventions`, not yet migrated) recording which Open Library editions a user has added to their collection.
- Add an "Add to Shelf" action to `BookReadingActions` (the book actions component), available in both compact mode (as a dropdown item) and expanded mode (as its own control), that opens an editions-picker modal for the work.
- The editions modal reuses `WorkEditionList` forced into vertical/paginated mode, extended to support searching by publication year and publisher in that mode (currently that search input only renders in the horizontal "auto" layout).
- Each edition (in the modal, and directly in the on-page `WorkEditionList` shown on a work's detail page) gets an add/remove toggle. Adding an edition marks the work `owned` and records that edition; removing an edition removes the work from the collection (`owned = false`) only when it was the user's last edition of that work. **BREAKING** (behavioral): this supersedes the previously documented rule that removing the last edition never auto-clears `owned` — the collection UI is the only place `owned` is set, so it is also responsible for clearing it.
- Add a link to the matching Open Library editions page in the modal so a user can add a missing edition on Open Library itself when it isn't listed.
- Replace the profile Bookshelf placeholder with a real, masonry-style grid of the profile owner's collection: one tile per added edition, plus one fallback-cover tile per work marked `owned` with no edition picked (5 columns at the largest breakpoint, 2 at the smallest). The section heading shows the total tile count, and the Bookshelf supports searching by title and sorting by title or release year. When viewing your own profile, each tile has a remove control (with a confirmation step) that undoes the add.
- Update the profile showcase's Collection progress indicator, since the Bookshelf it referred to as not-yet-existing now exists.
- The Add to Shelf control's label reflects whether the work is already owned ("On Shelf" vs. "Add to Shelf"), matching the existing convention of the other reading-status controls in the same component.
- Add an owned-count stat to a King work's detail page (alongside its existing reading/want-to-read/read counts), and a site-wide "Books Owned" total to the homepage stats card.
- Add a new personalized recommendation — a King work the signed-in user owns but hasn't read — shown on the homepage, the works browsing page, and (owner-only) the profile showcase, alongside the existing recommendation widgets on each.

## Capabilities

### New Capabilities
- `book-collection`: adding/removing specific Open Library editions to a signed-in user's collection, from both the book actions control and a work's edition list, including the ownership side-effects and the Open Library "add a missing edition" link.

### Modified Capabilities
- `profile-showcase`: the Collection progress requirement's "non-interactive placeholder, since no bookshelf feature exists yet" behavior is replaced, new Bookshelf requirements (masonry grid of the owner's collection, tile count, search, sort, owner-only removal) replace the "coming soon" placeholder, and an owner-only owned-unread recommendation is added.
- `work-details`: adds an owner-count stat alongside the work detail page's existing reading-status counts.
- `homepage`: adds a books-owned total to the stats card, and a signed-in-only owned-unread recommendation (inserted into the existing recommendation order).
- `works-browsing`: adds a signed-in-only owned-unread recommendation to the sidebar.

## Impact

- **New migration**: `user_book_editions` table + RLS policies, per `supabase-conventions`.
- **New composable**: `useBookshelf()` (edition reads/writes on `user_book_editions`, two-write add/remove that also updates `user_books.owned`).
- **Modified**: `useBooks.ts` gains `setOwned()` and `fetchOwnedUnreadRecommendation()`; `EditionList.vue` gains vertical-mode search + add/remove controls; `ReadingActions.vue` gains the Add to Shelf control (label reflecting owned state); `profile/Showcase.vue` gets a real Bookshelf grid plus the new recommendation; `useHomepage.ts` gains a books-owned total; `works/[slug].vue` gains an owner-count stat; `pages/index.vue` and `works/index.vue` gain the new recommendation.
- **New components**: an editions-picker modal, a bookshelf tile/grid component, a Bookshelf remove-confirmation modal, an owned-unread recommendation card.
- No changes to `king_works`, `adaptations`, or any seed-file-driven table.
