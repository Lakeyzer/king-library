## Why

The app has a dedicated Dark Tower section and needs to track Bachman-authored works as a distinct facet of the bibliography, but `king_works` currently has no way to flag either. Adding these fields to the canonical table lets both features query the bibliography directly instead of maintaining a separate parallel list.

## What Changes

- Add `dark_tower` (boolean, not null, default `false`) to `king_works` — flags a work as one of the core Dark Tower series works (not merely connected to it — that distinction belongs to `dark_tower_relation`).
- Add `bachman` (boolean, not null, default `false`) to `king_works` — flags a work published under the Richard Bachman pseudonym.
- Add `dark_tower_relation` (text, nullable) to `king_works` — free-text note on how a work connects to the Dark Tower series, used both for series-proper works (e.g. noting its entry) and for works outside the series that share characters, settings, or events with it; `null` means no connection worth noting.
- New migration only — schema change via Supabase CLI migration, applied with defaults so existing rows remain valid without backfill.
- Update the seed file (`supabase/seed/king_works.json`) and its loader type (`supabase/seed/load-king-works.ts`) to explicitly record `dark_tower: false`, `bachman: false`, `dark_tower_relation: null` for the 3 existing rows, keeping the seed file the authoritative shape of the table.
- Update the `king_works` schema table documented in `.claude/skills/supabase-conventions/SKILL.md` to include the three new columns, so the skill stays in sync with the actual table.
- No composable, query, or page changes — nothing yet reads or writes these fields from the app.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `king-works`: the canonical King work record gains `dark_tower`, `bachman`, and `dark_tower_relation` fields; the documented seed dataset for the 3 existing rows now specifies these fields explicitly.

## Impact

- **Database**: new migration on `king_works` (additive, backward compatible — `not null default false` columns and one nullable text column, no data loss, no lock-heavy rewrite for a 3-row table).
- **Seed data**: `supabase/seed/king_works.json` and `supabase/seed/load-king-works.ts` updated to include the new fields for existing rows.
- **Docs**: `.claude/skills/supabase-conventions/SKILL.md` schema table updated.
- **Not affected**: composables, pages, RLS policies (existing public-read/no-write policy already covers new columns), Open Library integration.
