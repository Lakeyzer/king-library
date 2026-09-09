## 1. Database schema

- [x] 1.1 Add a migration creating `series` (`id uuid primary key default gen_random_uuid()`, `name text not null unique`) with RLS enabled and a `for select using (true)` policy (no write policies), following `supabase/migrations/20260831200338_create_king_works_table.sql`'s pattern; verify `openspec/specs/king-series/spec.md`'s "Canonical series storage" and "Public read access" scenarios by querying the local Supabase instance as both an anonymous and an authenticated client.
- [x] 1.2 Add a migration creating `series_works` (`id uuid primary key default gen_random_uuid()`, `series_id uuid not null references series(id) on delete cascade`, `king_work_id uuid not null references king_works(id) on delete cascade`, `position int not null`, `unique (series_id, king_work_id)`, `unique (series_id, position)`) with the same RLS pattern; verify the unique constraints reject a duplicate `(series_id, position)` insert and a duplicate `(series_id, king_work_id)` insert via local SQL.
- [x] 1.3 Verify no insert/update/delete succeeds against either table from an authenticated client (matching "No client-side writes to series data"), same manual check used for `king_works`.

## 2. Seed data

- [x] 2.1 Add `supabase/seed/series_seed.json` with exactly three series - "Dark Tower", "Mercedes Killer", "Talisman" - and their member works and positions, matching `openspec/specs/king-series/spec.md`'s "Seed data reflects the three canonical series" scenario exactly.
- [x] 2.2 Add a loader script (alongside `supabase/seed/load-king-works.ts`, reusing `supabase/seed/loader.ts` where it fits) that inserts `series_seed.json` into `series` and `series_works`, resolving each seeded work title to its `king_works.id`; verify by running it locally and confirming row counts match the seed file.
- [x] 2.3 Run the loader against local Supabase and manually spot-check one series' member order via a SQL query joining `series_works` to `king_works` ordered by `position`.

## 3. Series data access

- [x] 3.1 Add `app/composables/useSeries.ts` exposing `fetchAllSeries()` (all series with ordered member works) and a `seriesByWorkId` lookup keyed by `king_work_id`, following `useBooks()`'s `userBooksByWorkId` pattern; verify by calling it in a scratch page/console and confirming the three seeded series come back with correctly ordered members.
- [x] 3.2 Extend `BookshelfItem` (in `app/composables/useBookshelf.ts`) with nullable `seriesId`, `seriesName`, and `seriesPosition` fields, and populate them in `fetchBookshelf` via `useSeries().seriesByWorkId`; verify a manual fetch for a user who owns a Dark Tower book returns that item with its series fields set, and an item for a standalone work returns them as null.

## 4. Bookshelf grouping UI

- [x] 4.1 Add a "Group series" `UCheckbox` to `app/components/profile/Bookshelf.vue`'s controls row, unchecked by default, shown only when `localItems.length` (matching the existing search/sort controls' visibility); verify it renders and toggles.
- [x] 4.2 Implement `groupedOrder`/`groupedColumns` in `Bookshelf.vue` per design.md's "Grouping reorders the flat item list, then reuses the same round-robin column assignment" - walk `visibleItems`, splice same-`seriesId` items (sorted by `seriesPosition`) in as one contiguous run per series, then run the existing `index % columnCount` assignment over that reordered list; verify with a manual test collection containing a full series, a partial series (missing one member), and standalone works that: (a) the series flows left-to-right and wraps to the next row in reading order rather than stacking in one column, (b) the partial series only shows its present members, (c) standalone works remain individually sorted.
- [x] 4.3 Wire the checkbox to switch the template between the existing `columns` and the new `groupedColumns`; verify toggling the checkbox on/off switches layouts without a page reload and that unchecking restores the original round-robin order.
- [x] 4.4 Verify grouping combined with an active search term only groups the tiles that pass the filter (per "Grouping applies after the active search filter") - manually search to a subset of one series' works with grouping on and confirm only the matches are grouped.
- [x] 4.5 Verify grouping combined with each sort field (title, release year, both directions) reorders series-as-units and standalone tiles per the active sort, while each series' internal order stays its reading order regardless of sort field/direction.

## 5. Release prerequisites

- [ ] 5.1 Before this change ships, push the `series`/`series_works` migrations and `series_seed.json` data to hosted Supabase, per `CLAUDE.md`'s release process (schema/seed changes land before the merge that ships code depending on them) and `supabase-conventions`'s local-development workflow.
