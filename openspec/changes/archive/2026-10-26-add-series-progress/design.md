## Context

See proposal.md - Why. Current state that shapes the approach:

- `useBooks().fetchProfileBookStats(userId)` computes Overall / Bachman / Dark Tower / Collection on the client. It loads active King works plus one user's `user_books` rows, leaves out omnibuses, and groups alternate texts by `counts_with_id ?? id` (`progressGroupId`). `Showcase.vue`, `compare.vue` and `dark-tower.vue` (which uses only `.darkTower`) consume it.
- `useSeries().fetchAllSeries()` already returns every series with members ordered by position. It also fills the `seriesByWorkId` state that `useBookshelf` uses for "Group series".
- `series_works.work_id` already references `works` (renamed in `20260928095110_merge_related_works_into_works.sql`), so a related work can be a member with no schema change.
- `useBooks().fetchNextDarkTowerBook` already shows the pattern this design reuses: it finds a series by name, loads the alternate rows (`counts_with_id in memberIds`), and treats reading an alternate as reading its member.
- The Dark Tower series has 8 members, while the `dark_tower` flag covers 9 rows (the original Gunslinger plus the Revised Edition, one `counts_with_id` pair). The two currently give the same total of 8, and must keep doing so.

## Goals / Non-Goals

**Goals:**
- One series-progress computation shared by the showcase, the compare page and the Dark Tower page.
- Adding a series to the seed data makes its bar appear with no code change.

**Non-Goals:**
- No schema migration, and no new column for series display order or icon.
- No change to the `bachman` / `dark_tower` flags or anything else that reads them (works filter, detail badges, Dark Tower page lists, `dark_tower_journey_stats`).
- No change to the "Works by Others" progress section or to Bookshelf grouping logic. Grouping picks up the new series automatically through the shared tables.

## Decisions

### `fetchSeriesProgress(userId)` lives in `useSeries`
It returns `SeriesProgress[]` (`{ id, name, count, total }`) in `fetchAllSeries` order, and is built on `fetchAllSeries()` plus three parallel queries:
1. `works` for the member ids: `id, type, active` (no `kind` filter, since members can be related works),
2. alternate rows: `works.select('id, counts_with_id').in('counts_with_id', memberIds)`,
3. `user_books.select('work_id').eq('user_id', userId).eq('read', true)`.

For each series, the counted members are the members whose work is active and not `type = 'omnibus'`. `total` is the number of counted members. `count` is the number of counted members where the member, or any of its alternates, is in the read set.

That's the same alternate rule `fetchNextDarkTowerBook` uses. It has to look up alternates from the member's side, because the series member is the Revised Edition and the original's `counts_with_id` points at it. Each series is computed on its own, so a work in two series counts toward both.

*Alternative considered:* extend `fetchProfileBookStats` with a `series` field. Rejected because that function is King-only by contract (Overall/Collection), while series progress spans both kinds. Mixing them would blur the "King indicators ignore By Other Hands works" rule. A separate function also lets the Dark Tower page stop fetching the full King stats just to read one figure.

*Alternative considered:* a SQL view. Rejected for the same reason the existing stats are computed client-side: the data is small (5 series, about 30 members) and the existing pattern is client-side.

### `ProfileBookStats` drops `bachman` and `darkTower`
Nothing reads them once Showcase, Compare and the Dark Tower page switch over. Leaving them in would keep a second, flag-based definition of "Dark Tower progress" that could drift from the series one. `progressFor` stays (it's still used for `overall`). Its predicate parameter type narrows accordingly, and the `works` select drops `dark_tower, bachman`.

### Series display order: a name-keyed list in `utils/seriesDisplay.ts`, applied in `fetchAllSeries`
The order is Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy. `compareSeriesOrder` ranks by position in that list, and any series not in it goes last, by name. `fetchAllSeries` sorts with it, so the showcase, the Compare page and the `/works` dropdown all share one order. It sits next to the icon map, keyed by name for the same reason (series ids are seed-generated).

*Alternative considered:* a `display_order` column on `series`. It would let the seed own the order, but it means a migration plus a hosted schema push before merge, for five rows. If series start changing often, move the order into the seed then.

### Series grid layout
The Series grid is `grid-cols-1 md:grid-cols-2 lg:grid-cols-6`. Each card's span is set by its index: the first card is `md:col-span-2 lg:col-span-3`, the second `lg:col-span-3`, and the rest `lg:col-span-2`. That gives two half-width cards and then rows of three on large screens, and one full-width card and then rows of two on medium screens. The layout depends on Dark Tower and Bachman Books being first in the display order. The span helper (`seriesCardClass`) lives in `utils/seriesDisplay.ts` and the Compare page's Series group uses it too, so both pages lay series out the same way.

### Icon per series, color per section
A `seriesIcon(name)` helper (`app/utils/seriesIcon.ts`) maps known series names to an icon: Bachman Books keeps `i-lucide-user-round` and Dark Tower keeps `i-lucide-rose`, while Gwendy, Hodges & Holly and Talisman get their own. Anything unknown gets `i-lucide-library-big`. Color is set per showcase section, not per series: every Reading Progress bar is `primary`, every Series bar `secondary`, and every Works by Others bar `info`, so a section reads as one group.

The icon names must be literal strings in a `.ts`/`.vue` file so the client bundle scan picks them up (nuxt-conventions "Icons"). Confirm each new name exists in lucide before using it.

*Alternative considered:* store the icon in the `series` table. Rejected because it's presentation, not data, and it would need a migration.

### Showcase layout
Reading Progress keeps four cards (Overall Bibliography, Short Works, Adaptations Watched, Collection) in a `sm:grid-cols-2` grid. Below it, a "Series" heading (the same `heading-2` + icon pattern as "Works by Others") holds one `ProfileProgressBar` per series in a `sm:grid-cols-3` grid. `ReaderChecklistTab.vue` fetches series progress with its own `useAsyncData` key (`profile-${id}-series-progress`) next to the existing stats fetch, and passes a new `seriesProgress: SeriesProgress[]` prop to `Showcase`.

### Compare page
It fetches `fetchSeriesProgress` for both users in parallel with the existing stats fetches. It removes the Bachman/Dark Tower cards and renders a "Series" sub-heading with one `ProfileCompareProgressCard` per series, pairing the two users' entries by series id. Both lists come from the same `fetchAllSeries` call order, so pairing by id is safe even if order changed.

### `/works` series filter
The page fetches `fetchAllSeries()` alongside `fetchKingWorks()` and renders both on the server. `/works` is a cached page, and series data is catalog content that only changes with a reseed + deploy, so that's allowed (nuxt-conventions "Cached public pages"). The `#extra-filters` slot gets a `USelect` (`i-lucide-layers`), styled like the existing type dropdown, with "All works" (`'all'`) and then one option per series keyed by id. A work matches a series when its id, or its `counts_with_id`, is in that series' member set. That keeps the original Gunslinger under Dark Tower, as the old flag filter did. Series with no King members would still be listed, which can't happen with the current five.

### Seed data
- `series_seed.json`: keep the existing ids. Rename `578cd738-...` from "Mercedes Killer" to "Hodges & Holly" (an upsert by id renames it in place, so Bookshelf grouping and any id references stay stable). Add two rows with new UUIDs for "Bachman Books" and "Gwendy's Trilogy".
- `series_works_seed.json`: add rows with new UUIDs for the Bachman (novels at positions 1-7, The Bachman Books omnibus at 8 - a member for display and grouping, never counted), Hodges & Holly (positions 4-7: The Outsider, If It Bleeds, Holly, Never Flinch) and Gwendy (positions 1-3, Magic Feather = related work `61297b47-...`) members. Existing rows stay as they are.
- `load-series.ts` already upserts `series` and prune-loads `series_works`, so a local run of it applies everything.

## Risks / Trade-offs

- [Upserting `series` with a new name could conflict on `unique(name)` if a stale row already uses the target name] → The target names are new, so there's no conflict. Upsert is by id.
- [`seriesByWorkId` keeps only one membership per work (last write wins)] → None of the five series share a member today. Progress doesn't rely on that map, so overlap would only affect Bookshelf grouping, as it already would.
- [If It Bleeds is a collection, so Holly fans might not count it as "a Holly book"] → The user explicitly chose to include it. It's one seed row to remove later.
- [The Dark Tower page figure could drift from the profile figure] → Both read the same `fetchSeriesProgress` Dark Tower entry, found by name like `fetchNextDarkTowerBook` does.
- [`profile-compare` delta targets a capability that isn't in `openspec/specs/` yet] → Archive `compare-profiles` before archiving this change.
- [Totals change for users (Holly 3 → 7, a Gwendy bar appears)] → Intended. Bachman (7) and Dark Tower (8) totals are unchanged.

## Migration Plan

1. Locally: run `load-series.ts` against the local Supabase and check the five series and their member counts.
2. Before merging to `main`: with an explicit go-ahead, run `load-series.ts` against hosted. There's no schema migration, only seed data. This must land before the code: the new UI reads the same tables, and if the reseed hasn't happened, the old seed would simply show 3 series bars (no crash, but Bachman would be missing).
3. Rollback: revert the code. The extra series rows are harmless to the old code (they only add Bookshelf groups). Revert the seed files and rerun `load-series.ts` to drop the new memberships (the "Hodges & Holly" name would need the old name restored).
