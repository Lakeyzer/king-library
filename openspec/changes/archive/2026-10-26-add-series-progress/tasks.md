## 1. Seed data

- [x] 1.1 In `supabase/seed/series_seed.json`, rename series `578cd738-d2ed-40bc-b02b-d90156e2b92e` to "Hodges & Holly" and add "Bachman Books" and "Gwendy's Trilogy" rows with new UUIDs. Verify: the file has exactly 5 series with unique names and the existing ids are unchanged.
- [x] 1.2 In `supabase/seed/series_works_seed.json`, add Bachman Books members (Rage, The Long Walk, Roadwork, The Running Man, Thinner, The Regulators, Blaze at positions 1-7, then The Bachman Books omnibus `2f3ae52c-cd3a-466e-bf1b-2f7985660352` at 8), Hodges & Holly positions 4-7 (The Outsider, If It Bleeds, Holly, Never Flinch), and Gwendy members (Gwendy's Button Box 1, Gwendy's Magic Feather `61297b47-3eb4-4f1d-b86d-134b2955b2ad` 2, Gwendy's Final Task 3), each with a new UUID. Verify with a quick node script: every `work_id` resolves in `king_works.json` or `related_works.json`, and no `(series_id, position)` or `(series_id, work_id)` pair repeats.
- [x] 1.3 Run `pnpm seed:series` against local Supabase. Verify: querying `series` / `series_works` locally returns 5 series with 8 / 8 / 3 / 7 / 3 members (Bachman, Dark Tower, Gwendy, Hodges & Holly, Talisman).

## 2. Series progress composable

- [x] 2.1 Add the series display order (Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy; unknown series last, by name) in `app/utils/seriesDisplay.ts` and sort `fetchAllSeries` with it (keeping members ordered by position). Verify: the returned names come back in that order.
- [x] 2.2 Add an exported `SeriesProgress` type and `fetchSeriesProgress(userId)` to `useSeries`, per design.md: counted members are active and not omnibus, of either kind, and reading an alternate (`counts_with_id`) satisfies its member's slot. Verify: `pnpm typecheck` passes, and for a test user who has read only the original Gunslinger and Gwendy's Magic Feather, it returns Dark Tower 1/8 and Gwendy 1/3.
- [x] 2.3 Remove `bachman` / `darkTower` from `ProfileBookStats` and `fetchProfileBookStats` in `app/composables/useBooks.ts` (drop the flags from its `works` select and narrow `progressFor`'s predicate type). Verify: `pnpm typecheck` flags only the consumers fixed in sections 3-5.

## 3. Profile showcase

- [x] 3.1 Add a `seriesIcon(name)` helper with a fallback icon. Keep Bachman Books `i-lucide-user-round` and Dark Tower `i-lucide-rose`, and choose lucide icons for Gwendy, Hodges & Holly and Talisman as literal strings (nuxt-conventions "Icons"). On the showcase, color bars per section: Reading Progress `primary`, Series `secondary`, Works by Others `info`. Verify: every icon name exists in lucide and an unknown name returns the fallback.
- [x] 3.2 In `app/components/profile/ReaderChecklistTab.vue`, fetch `fetchSeriesProgress(profile.id)` with its own `useAsyncData` key and pass it to `Showcase` as `seriesProgress`. Verify: `pnpm typecheck` passes.
- [x] 3.3 In `app/components/profile/Showcase.vue`, remove the Bachman Books and Dark Tower bars from Reading Progress (leaving four cards in a `sm:grid-cols-2` grid), and add a "Series" section with one `ProfileProgressBar` per entry in a `grid-cols-1 md:grid-cols-2 lg:grid-cols-6` grid with per-index spans (see design.md "Series grid layout"). Verify by hand: large screens show Dark Tower + Bachman, then Talisman + Hodges & Holly + Gwendy; medium screens show Dark Tower alone, then rows of two; bars at 0 still show, and Bachman/Dark Tower show the same figures as before.
- [x] 3.4 In `app/components/profile/Bookshelf.vue`, cap the Bookshelf at 4 columns on large screens (was 5). Verify by hand: at 1024px and wider, the shelf shows 4 tiles per row.

## 4. Compare page

- [x] 4.1 In `app/pages/profile/[username]/compare.vue`, fetch series progress for both users, remove the Bachman Books / Dark Tower cards, and add a "Series" group of `ProfileCompareProgressCard`s paired by series id, in a `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` grid. Verify by hand: a comparison shows one chart per series, and each user's counts match their own showcase.
- [x] 4.2 Give the Compare page's Series group the same grid as the profile (`lg:grid-cols-6` with `seriesCardClass` spans from `utils/seriesDisplay.ts`). Verify by hand: large and medium screens match the profile's Series layout.
- [x] 4.3 Give the Compare page's Reading Progress charts the profile's grid (`grid-cols-1 sm:grid-cols-2`, same card order). Verify by hand: the four charts show as a 2 by 2 grid from `sm` up, like the profile.

## 5. Dark Tower page

- [x] 5.1 In `app/pages/dark-tower.vue`, source the sidebar progress from the Dark Tower entry of `fetchSeriesProgress(user.sub)` (found by name), not `fetchProfileBookStats(...).darkTower`. Verify by hand: the sidebar figure matches the profile's Dark Tower series bar, and signed-out visitors still see nothing.

## 5b. Works page series filter

- [x] 5b.1 In `app/pages/works/index.vue`, replace the All / Bachman / Dark Tower `URadioGroup` with a series `USelect` ("All works" plus one option per series from `fetchAllSeries`, fetched server-side next to the works), matching members and their `counts_with_id` alternates. Verify: `pnpm typecheck` shows no new errors, and by hand, choosing "Dark Tower" lists both Gunslinger rows and "Gwendy's Trilogy" lists 2 books.

## 6. Wrap-up

- [x] 6.1 Update the `supabase-conventions` skill wherever it describes series membership as King-only, or the series seed as three series. Verify: a grep for "Mercedes Killer" across the repo (outside `openspec/changes/archive`) finds no live references.
- [x] 6.2 Run `pnpm lint` and `pnpm typecheck`. Verify: both pass with no new warnings, and a grep for the em dash character in changed files finds none. (Every changed file lints clean and no em dashes. Already failing before this change: repo-wide lint errors in untouched files, and one typecheck error on `ACTIVITY_CATEGORIES` in compare.vue.)
- [x] 6.3 Report what's ready for manual testing (no dev server), and note that hosted needs `pnpm seed:series:hosted` with an explicit go-ahead before merging to `main`, and that `compare-profiles` must be archived before this change.
