## 1. Seed data

- [x] 1.1 In `supabase/seed/king_works.json`, set `dark_tower_relation` for 'Salem's Lot, The Stand, The Eyes of the Dragon, The Talisman, Black House, Insomnia, Rose Madder, Hearts in Atlantis, Everything's Eventual, IT, Desperation, and The Regulators to the notes drafted in design.md's "Related-works research" table, and verify by re-running the seed loader locally and confirming `select title, dark_tower_relation from king_works where dark_tower_relation is not null` returns exactly those 12 rows. (Notes were reworded twice more after initial review, both times to strip out anything that spoils a Dark Tower plot beat — see design.md's "Related-works research" note on the two revision passes.)
- [x] 1.2 Per follow-up request, add Charlie the Choo-Choo (already an existing `king_works` row) to the related-works set with its own `dark_tower_relation` note, bringing the total to 13. Verify the same query now returns 13 rows including it.

## 2. Composables

- [x] 2.1 Add `dark_tower_relation` to `KING_WORK_COLUMNS` and the `KingWork` interface in `app/composables/useKingWorks.ts`, and verify `fetchKingWorks()`'s returned objects include the new field (e.g. via a quick console check on `/works`, which should otherwise render unchanged).
- [x] 2.2 Add `fetchDarkTowerRelatedProgress(userId): Promise<CategoryProgress>` to `app/composables/useBooks.ts`, following `fetchProfileBookStats`'s `progressFor` pattern but filtering `king_works` to `dark_tower_relation is not null`, and verify it returns `{ count, total }` matching a manual count against the related-work seed rows (13, after task 1.2) and the calling user's `user_books.read` rows.
- [x] 2.3 Add `fetchNextDarkTowerBook(userId)` to `app/composables/useBooks.ts`: fetch the Dark Tower series via `useSeries().fetchAllSeries()`, cross-reference with the user's read `user_books` rows, and return the unread member with the lowest `position` (or `null` if all 8 are read). Verify by marking 3 of the 8 core novels read for a test user and confirming the function returns the lowest-position book among the remaining 5.
- [x] 2.4 Add `fetchNextDarkTowerRelatedBook(userId)` to `app/composables/useBooks.ts`, mirroring `fetchOwnedUnreadRecommendation`'s random-pick-among-candidates shape but sourced from the related works (13, after task 1.2) filtered to unread, returning `null` once all are read. Verify by marking all but one related work read for a test user and confirming the function always returns that one remaining work.

## 3. Components

- [x] 3.1 Create `app/components/dark-tower/CoreList.vue`: renders the 8 core novels, in series-position order, as a `UCarousel` (arrows + dots) of `DarkTowerCarouselItem` (cover left; title, release year, description, read actions right) — see design.md "Main content presented as two `UCarousel`s, not lists". Verify by rendering it with the 8 core works and confirming carousel order matches design.md's canonical order (Keyhole 5th).
- [x] 3.2 Create `app/components/dark-tower/RelatedList.vue`: renders the Related Works set as a `UCarousel` of `DarkTowerCarouselItem`, passing each work's `dark_tower_relation` as the item's `note`, for works with a non-null `dark_tower_relation`. Verify it renders all 13 seeded works with their notes and excludes any inactive work.
- [x] 3.2a Create `app/components/dark-tower/CarouselItem.vue`, the shared per-item layout (cover, title, release year, description, optional relation note, `BookReadingActions`) used by both 3.1 and 3.2.
- [x] 3.3 Reuse `app/components/profile/ProgressBar.vue` (`<ProfileProgressBar>`) for both sidebar progress widgets — Dark Tower and Dark Tower Related — with page-specific `label`/`icon`/`color` props. Verify both bars render with correct count/total when signed in, and verify neither renders when signed out.
- [x] 3.4 Create `app/components/dark-tower/SuggestionCard.vue` (a single parameterized component — `heading`/`icon`/`work` props — reused for both "read next" picks rather than two near-duplicate files) mirroring `WorkRecommendation`'s presentational structure, rendering nothing when `work` is `null`.

## 4. Page

- [x] 4.1 Create `app/pages/dark-tower.vue`: fetch `fetchKingWorks()`, `fetchAllSeries()`, and — gated on `user.value`, mirroring `app/pages/works/index.vue`'s pattern — `fetchProfileBookStats`, `fetchDarkTowerRelatedProgress`, `fetchNextDarkTowerBook`, and `fetchNextDarkTowerRelatedBook`, all via parallel `Promise.all`/`useAsyncData` calls. Lay out main content (`CoreList`, `RelatedList`) and sidebar (the four signed-in-only widgets from Task 3) in the `flex flex-col gap-4 lg:flex-row lg:items-start` / sidebar `lg:w-96 lg:shrink-0` shape used by `BibliographyBrowsePage`. Verify by visiting `/dark-tower` signed out (main content only, no sidebar widgets) and signed in (all four sidebar widgets present, accurate to seeded/test read data).
- [x] 4.2 Set page SEO via `useSeo()`/`setPageSeo`, matching the pattern in `app/pages/works/index.vue`.

## 5. Navigation

- [x] 5.1 Add a `{ label: 'Dark Tower', to: '/dark-tower', icon: 'i-lucide-rose' }` entry to the `links` array in `app/components/core/AppHeader.vue` (icon changed from the initial `i-lucide-castle` to `i-lucide-rose` per follow-up request, matched on the page header, the sidebar Dark Tower progress bar, and the profile page's Dark Tower indicators). Verify the link appears in primary navigation and routes to `/dark-tower`.

## 6. Verification

- [x] 6.1 Manually walk through both signed-out and signed-in states on `/dark-tower` per the scenarios in `specs/dark-tower-page/spec.md`, including a user with 0, some, and all core/related works read, and confirm each sidebar widget's presence/absence and content matches its scenario.
