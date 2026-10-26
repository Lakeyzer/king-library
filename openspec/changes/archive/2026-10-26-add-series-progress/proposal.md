## Why

The profile's Reading Progress section treats Bachman and Dark Tower as one-off bars driven by the `bachman` / `dark_tower` flags on `works`, so there's no way to track progress through King's other series (Hodges & Holly, Gwendy, Talisman). The `series` / `series_works` tables already hold series and their reading order for the Bookshelf's "Group series" feature. Using them for progress too gives one place to define a series, and one way to measure progress through it.

## What Changes

- Add a **Series** section to the profile showcase, with one progress bar per series in the `series` table, shown for every series even at 0 read, in a fixed order (Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy), with Dark Tower and Bachman Books on a shared first row on large screens and Dark Tower on its own on medium screens.
- Measure series progress from `series_works` membership instead of the `bachman` / `dark_tower` flags. Every active, non-omnibus member counts, King or By Other Hands, so Gwendy's Magic Feather (Richard Chizmar alone) counts toward the Gwendy bar. Alternate texts linked by `counts_with_id` (the original Gunslinger and its Revised Edition) still share one slot.
- **BREAKING (UI)**: Remove the "Bachman Books" and "Dark Tower" bars from the main Reading Progress grid. They reappear as series bars in the new Series section. Overall Bibliography, Short Works, Adaptations Watched and Collection stay in Reading Progress.
- Seed data changes (`supabase/seed/series_seed.json`, `series_works_seed.json`):
  - Add a **Bachman Books** series: Rage, The Long Walk, Roadwork, The Running Man, Thinner, The Regulators, Blaze in publication order, then The Bachman Books omnibus at position 8. The omnibus is a member, so it shows with the series on `/works` and the Bookshelf, but as an omnibus it never counts toward the bar (still x/7).
  - Rename **Mercedes Killer** to **Hodges & Holly** and extend it: Mr. Mercedes, Finders Keepers, End of Watch, The Outsider, If It Bleeds, Holly, Never Flinch.
  - Add a **Gwendy's Trilogy** series: Gwendy's Button Box, Gwendy's Magic Feather (By Other Hands), Gwendy's Final Task.
  - Dark Tower and Talisman stay as they are.
- The Compare page replaces its Bachman Books and Dark Tower charts with a Series group: one two-bar chart per series.
- On `/works`, the All / Bachman / Dark Tower radio filter is replaced by a series dropdown ("All works" plus each series). Alternate texts show with their series, and only King works are listed, as before.
- The Dark Tower page's sidebar progress reads from the Dark Tower series progress, so it keeps matching the profile's Dark Tower bar.
- The `bachman` and `dark_tower` flags stay on `works`. The works filter, work detail badges and Dark Tower page lists still use them. They just no longer drive profile progress.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `king-series`: membership covers any work (King or By Other Hands), the seed data covers the five series above, and a new requirement defines how a user's per-series reading progress is computed and the order series are listed in.
- `profile-showcase`: the Bachman and Dark Tower bars leave Reading Progress for a new Series section with one bar per series. The "King progress indicators ignore By Other Hands works" rule no longer names Bachman / Dark Tower, and series bars count every member.
- `dark-tower-page`: sidebar Dark Tower progress comes from the Dark Tower series and matches the profile's Dark Tower series bar.
- `works-browsing`: the Bachman / Dark Tower flag filter is replaced by a series dropdown.
- `profile-compare`: the compared categories swap Bachman Books / Dark Tower for one chart per series. This capability currently exists only in the unarchived `compare-profiles` change, so that change must be archived before this one.

## Impact

- **Composables**: `app/composables/useSeries.ts` (new `fetchSeriesProgress(userId)`), `app/composables/useBooks.ts` (`ProfileBookStats` drops `bachman` / `darkTower`).
- **Components / pages**: `app/components/profile/Showcase.vue`, `app/components/profile/ReaderChecklistTab.vue` (fetches and passes series progress), `app/pages/profile/[username]/compare.vue`, `app/pages/dark-tower.vue`, `app/pages/works/index.vue`.
- **Seed data**: `supabase/seed/series_seed.json`, `supabase/seed/series_works_seed.json`. These need reseeding on hosted Supabase before merge to `main` (via `load-series.ts`; `series_works` is loaded with `prune`). No schema migration: `series_works.work_id` already references `works`, so it accepts related works.
- **Bookshelf grouping**: it uses the same tables, so "Group series" will also start grouping Bachman, the full Holly run and the Gwendy trilogy (including the By Other Hands Magic Feather tile). That's intended.
