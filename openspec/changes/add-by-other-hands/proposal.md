## Why

Fans collect things adjacent to King's own bibliography - Marvel's Dark Tower graphic novels, companion/reference books written about King's work by other authors, authorized tie-in novels - but none of it is King's own writing, so it has no place in `king_works` or in any reading/collection stat that represents "how much of King have I read." Right now there's nowhere in the app to track this material at all. It deserves its own home: trackable the same way a book is, but structurally incapable of touching King completion numbers.

## What Changes

- Add a new canonical, manually-curated list of non-King works ("By Other Hands" works), covering three categories: Dark Tower comics/graphic novels, companion/reference books about King's work, and authorized tie-in/spin-off novels.
- Add a dedicated `/by-other-hands` page listing these works, filterable by category, showing title, creator(s), category, cover, and a short note on how each connects to King's work; each entry links to its own detail page.
- Let a signed-in user track a By Other Hands work the same way they track a King book's ownership/reading state - owned, want-to-read, currently reading, read (with start/finish dates) - stored in its own table, entirely separate from `user_books`. No wishlist state (see below).
- Support omnibus By Other Hands works that collect other By Other Hands works (e.g. a Marvel omnibus edition collecting several individually-published comics), with the same "marking the omnibus read marks its contents read" cascade behavior King's `king_work_omnibus_works` already has for the Bachman Books.
- Let a signed-in user pick a specific Open Library edition of a By Other Hands work to add to their collection, the same editions picker/toggle/list pattern `user_book_editions` gives King works.
- Show a work's own detail page the same action-button layout (owned/reading-status, one button per action) and aggregate stats (currently-reading/want-to-read/read/owned counts) a King work's detail page shows, scoped to that By Other Hands work.
- Show a signed-in user their own completion count for this category ("X of Y read") on the page itself.
- Add a link to `/by-other-hands` in primary navigation.
- **Explicitly exclude** By Other Hands works and their tracking data from every King-specific reading/collection stat: `work_stats`, `bibliography_items`/`user_read_items` (category completion, including Dark Tower completion), profile reading stats, and any owned/read leaderboard. This falls out of using a wholly separate table rather than reusing `king_works`/`user_books` - no existing query touches the new tables, so no existing stat needs to change to stay correct. (The new per-work stats above are By-Other-Hands-only, e.g. "12 people own this comic" - not a King stat, so this exclusion doesn't apply to them.)

Not in scope for this change: full reread history (no `user_related_work_reads` equivalent to `user_book_reads` - a work has one current read state, not a logged history of every read).

**Revision notes:** an earlier pass of this change also added a wishlist state for By Other Hands works, mirroring `user_books.wishlisted`. That's been removed - King books' own `wishlisted` column turned out to have no UI anywhere in the app either, so it wasn't a pattern worth carrying into a new feature. Omnibus support, detail pages, additional seed data (the Beginnings/Gunslinger/Drawing of the Three comic omnibuses and their components, plus Robin Furth's Dark Tower Concordance), edition-level tracking, and per-work stats were all added across follow-up revision passes after the first implementation. A later pass also fixed a gap the detail page's expanded controls had introduced (no way to mark a work read without starting it first) and extended marking a work read to optionally capture a date range, rating, and note, mirroring King's mark-read flow.

A final pass fixed a signed-out visitor's action controls across the app (not just By Other Hands): `ByOtherHandsActions`, `BookReadingActions`, `AdaptationWatchActions`, short-story reading actions, and both edition-toggle buttons previously hid entirely for a signed-out visitor. They're now always shown; activating any of them while signed out opens the sign-in/sign-up modal instead of performing the action. `book-collection`'s archived spec has been corrected to match.

## Capabilities

### New Capabilities

- `by-other-hands`: canonical list of non-King works (Dark Tower comics/graphic novels, King companion/reference books, authorized tie-in novels) with omnibus support, a dedicated browsing page and per-work detail pages (with stats and King-detail-page-parity action controls), and per-user owned/read/edition tracking that is fully separate from and never counted in King reading/collection statistics.

### Modified Capabilities

(none - the new tables are entirely separate from `king_works`/`user_books`, so no existing stats, nav, or bibliography capability needs its requirements changed to stay correct)

## Impact

- New tables: `related_works` (seed-file-driven canonical list, mirrors `king_works`, includes an `is_omnibus` flag), `related_work_omnibus_works` (mirrors `king_work_omnibus_works`), `user_related_works` (per-user tracking, mirrors `user_books` minus `wishlisted`, plus `via_omnibus_id`, `note`, and `rating`), and `user_related_work_editions` (mirrors `user_book_editions`), all under RLS per `supabase-conventions`. New view: `related_work_stats` (mirrors `work_stats`).
- New seed files: `supabase/seed/related_works.json` and `supabase/seed/related_work_omnibus_works_seed.json`, loaded the same way as `king_works.json`/`king_work_omnibus_works_seed.json`.
- New pages: `app/pages/by-other-hands/index.vue` (listing) and `app/pages/by-other-hands/[slug].vue` (detail), following the same `index.vue` + `[slug].vue` sibling pattern as `works/`/`adaptations/`/`short-works/`.
- New composables: `useRelatedWorks()` and `useRelatedWorkEditions()`, following the one-composable-per-domain convention (mirrors `useBooks()`/`useBookshelf()`'s split).
- `useOpenLibraryEditions()` reused as-is - already generic over any Open Library work key.
- Small additive change to `BibliographyBrowsePage.vue`/`BibliographyListItem.vue`: new optional `subtitleOf`/`subtitle` prop (a line under the title, e.g. "By Robin Furth"), used by the By Other Hands listing but available to any bibliography page.
- `AppHeader.vue`: add the new nav link.
- No changes to `king_works`, `user_books`, `work_stats`, `bibliography_items`, `user_read_items`, or any existing page/composable.
