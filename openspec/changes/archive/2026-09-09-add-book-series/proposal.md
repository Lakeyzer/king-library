## Why

Several King works only make full sense read as part of a series — the Dark Tower, the Bill Hodges trilogy ("Mercedes Killer"), and The Talisman duology — but the app currently has no general way to say "this work belongs to that series" or "read these in this order." The only series-shaped data that exists today is an ad hoc Dark Tower boolean + relation note on `king_works`, which is specific to one series and not queryable as a group. Adding a general series model lets the Bookshelf (and future features) cluster a user's collection by series instead of flattening every book into one undifferentiated, alphabetized/chronological list.

## What Changes

- Add a canonical `series` list (own table, publicly readable, no client writes — mirrors how `king_works` is governed) seeded with three series: Dark Tower, the Bill Hodges trilogy ("Mercedes Killer"), and Talisman (The Talisman + Black House).
- Add a `series_works` join connecting `king_works` to `series`, recording each work's position within its series (its reading order).
- This is additive: the existing `dark_tower` flag and `dark_tower_relation` note on `king_works` are untouched and keep powering the existing Dark Tower browsing section, work details, and showcase progress bar. Dark Tower's series-table entry is a separate, parallel piece of data used only by series-aware features (currently just the Bookshelf), not a replacement for the flag.
- Add a "Group series" checkbox to the profile Bookshelf. When checked, tiles belonging to the same series are kept together within the masonry grid — treated as one unit placed into a single column — even though the shelf's title/year sort would otherwise interleave them with other tiles. Works within a grouped series are ordered by the series' own reading order, not by the active sort field. Works with no series membership, and the relative order between series/standalone units, still follow the active sort and column-assignment behavior.

## Capabilities

### New Capabilities
- `king-series`: Canonical series list (Dark Tower, Bill Hodges trilogy, Talisman) and the `king_works` <-> `series` membership with reading-order position; publicly readable, no client writes, seed-file-driven — same governance model as `king-works`.

### Modified Capabilities
- `profile-showcase`: Adds a "Group series" checkbox to the Bookshelf and defines how grouping changes tile ordering/column placement relative to the existing search and title/year sort behavior.

## Impact

- New Supabase table(s): `series`, `series_works` (migration + RLS policies, per `supabase-conventions`).
- New seed data: `supabase/seed/series_seed.json` (or equivalent), loaded the same way as `king_works.json`.
- New composable (e.g. `useSeries`) for fetching series + membership, following the existing "all Supabase queries go through composables" convention.
- `app/composables/useBookshelf.ts`: `fetchBookshelf` needs each item's series membership (series id, name, position) to support grouping.
- `app/components/profile/Bookshelf.vue`: new "Group series" checkbox control and grouped column-assignment logic alongside the existing search/sort logic.
