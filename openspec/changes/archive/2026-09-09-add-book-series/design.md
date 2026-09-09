## Context

`king_works` is the canonical bibliography (see `openspec/specs/king-works/spec.md`); it already carries a one-off `dark_tower` boolean + `dark_tower_relation` text for that single series, seeded via `supabase/seed/king_works.json` and loaded by `supabase/seed/load-king-works.ts`. There is no general series concept.

The Bookshelf (`app/components/profile/Bookshelf.vue`, data from `app/composables/useBookshelf.ts`) renders a masonry grid: `visibleItems` is search-filtered then sorted by title or release year, and `columns` assigns each item to `index % columnCount` (round-robin), per the existing `COLUMN_BREAKPOINTS` (2/3/5 columns). See proposal.md for why this change is additive rather than a migration of the `dark_tower` flag.

## Goals / Non-Goals

**Goals:**
- A general, reusable series data model (`series`, `series_works`) governed the same way as `king_works` (public read, no client writes, seed-driven).
- Bookshelf grouping that clusters a series' tiles into one masonry column and orders them by series reading order, per `specs/profile-showcase/spec.md`.

**Non-Goals:**
- No dedicated series browsing page, no "Part of: X" badge on work details, no changes to the existing `dark_tower` flag, its progress bar, or the Dark Tower browsing section.
- No support today for a King work belonging to more than one series in the seed data (the join table doesn't forbid it, but nothing currently needs it).
- No persistence of the "Group series" checkbox state across page loads (matches the existing search/sort controls, which are also session-local `ref`s).

## Decisions

### `series` + `series_works` as two tables, not a column on `king_works`
A work can in principle belong to more than one series, and a series has its own identity (name) independent of any one work. Mirrors how `user_book_editions` relates to `king_works` rather than being columns on it.

- `series`: `id uuid primary key`, `name text not null unique`.
- `series_works`: `id uuid primary key`, `series_id uuid not null references series(id) on delete cascade`, `king_work_id uuid not null references king_works(id) on delete cascade`, `position int not null`, `unique (series_id, king_work_id)`, `unique (series_id, position)`.

`unique (series_id, position)` enforces the spec's "no two works share a position within one series" at the database level. No auto-assignment logic is needed (unlike `king_works.shuffle_position`) because series membership is curated seed data, not user-driven.

### RLS: same pattern as `king_works`
Both tables get `enable row level security` plus a single `for select using (true)` policy and no insert/update/delete policy, exactly like `king_works`' "readable by everyone" policy — the absence of a write policy is what makes writes rejected, consistent with `supabase-conventions` and the king-works precedent.

### One `useSeries` composable, consumed by `useBookshelf`
A new `app/composables/useSeries.ts` fetches all series with their ordered members once (`fetchAllSeries`) and exposes a `seriesByWorkId` lookup (`Record<workId, { seriesId, seriesName, position }>`), mirroring `useBooks()`'s `userBooksByWorkId` pattern already used by `useBookshelf`. `useBookshelf.fetchBookshelf` calls it and attaches `seriesId` / `seriesPosition` (nullable) onto each `BookshelfItem`, the same way it already attaches `publishDate` and `openLibraryWorkKey` for sorting. Alternative considered: joining `series_works` directly into the two `fetchBookshelf` queries. Rejected because `useSeries`' data is small (3 series today), fully static from the client's point of view, and reused as-is with no per-item join needed elsewhere.

### Grouping reorders the flat item list, then reuses the same round-robin column assignment
`visibleItems` (search + sort) stays exactly as it is today. A new `groupedOrder` computed, used only when the checkbox is checked, produces a *reordered flat list* (not a list of columns):

1. Walk `visibleItems` in order. For each item with a `seriesId`, if that series hasn't been "placed" yet, pull *every* item in `visibleItems` sharing that `seriesId` (not just this one — so a search that filters out some members still groups only what's left, per "Grouping applies after the active search filter"), sort that subset by `seriesPosition`, and push it in as one contiguous run. Standalone items (`seriesId === null`) are pushed as-is.
2. A series' position in the resulting list is its earliest (per the active sort) member's position in `visibleItems` — i.e., the run of series tiles replaces that member's slot and everything shifts after it, rather than each member staying at its own separately-sorted slot.

The existing `index % columnCount` round-robin (extracted as `assignToColumns`) is then applied to `groupedOrder` exactly the same way it's applied to plain `visibleItems` for the ungrouped `columns`. Because the round-robin already reads left-to-right and wraps to the next row for consecutive flat indices, a contiguous run of series tiles naturally flows through the grid the same way — earlier iterations of this design instead grouped each series into a single column as an indivisible unit, which visually reads as the series being stacked vertically in one column rather than flowing left-to-right/wrapping like the rest of the grid; that turned out not to match the intended reading experience once seen in practice, so the column-per-series approach was dropped in favor of this reorder-then-reuse-the-existing-round-robin approach.

### "Group series" checkbox visibility
Shown next to the existing search/sort controls, in the same `v-if="localItems.length"` block — no series-specific empty state needed since an empty collection already hides that whole control row.

## Risks / Trade-offs

- **Row-alignment shift after a grouped series**: inserting a contiguous run in place of individually-sorted members shifts every later item's column/row position versus the ungrouped view (and versus a naive per-item grouping). This is expected and matches the "reads like a normal grid, just with series kept together" goal — not treated as a risk needing mitigation.
- **`useSeries` fetch adds a request to every Bookshelf load** (owner's own and any visitor's), even when grouping is never toggled on. Accepted: the dataset is tiny (3 series, ~13 works total today) and the existing `fetchBookshelf` already issues two parallel queries, so this is a small, cacheable addition, not a new class of cost.
- **Seed curation for Dark Tower's series-order list is a manual editorial call** (see `specs/king-series/spec.md` for the exact 8-work list and order chosen) — it deliberately excludes `dark_tower`-flagged entries with no settled reading position: "Charlie the Choo-Choo" (an in-universe tie-in, not a numbered entry) and "Other Worlds Than These" (a stub in the seed data today — no Open Library key, cover, or description). That flag is untouched and keeps flagging them, so nothing regresses; this only affects what `series_works` groups. If "Other Worlds Than These" is later fleshed out with real bibliographic data, revisit whether it gets a series position then.

## Migration Plan

1. Migration: create `series`, `series_works`, RLS policies (per Decisions above).
2. Seed file `supabase/seed/series_seed.json` + loader (extending `supabase/seed/loader.ts`'s pattern or a new small script alongside `load-king-works.ts`), run against local Supabase first, then hosted before merge — per this project's release process (`CLAUDE.md` "Release process": schema/seed changes go to hosted before the merge that ships code depending on them).
3. No backfill needed elsewhere — this is new, additive data with no existing consumers to migrate.
