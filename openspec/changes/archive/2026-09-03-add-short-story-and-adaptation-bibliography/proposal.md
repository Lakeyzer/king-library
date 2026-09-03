## Why

The app currently has a canonical bibliography for full-length King works (`king_works`) with a browsing page (`/works`), but nothing yet for short stories, story collections, or screen adaptations — three domains `supabase-conventions` already specifies but that have no tables, seed data, or pages. Seed data for all five missing tables already exists in the repo (`supabase/seed/*_seed.json`), so this change is scoped to catching the schema and UI up to that already-designed data.

## What Changes

- Add five new Supabase tables, each seed-file-driven and read-only at runtime (public read RLS only, no write policies, no new triggers), matching the schema already specified in `supabase-conventions`:
  - `king_short_stories`
  - `king_short_story_collections` (join: short story ↔ collection work)
  - `adaptations`
  - `adaptation_works` (join: adaptation ↔ King work)
  - `adaptation_short_stories` (join: adaptation ↔ short story)
- Load the existing seed files (`king_short_stories_seed.json`, `king_short_story_collections_seed.json`, `adaptations_seed.json`, `adaptation_works_seed.json`, `adaptation_short_stories_seed.json`) into these tables via the same upsert-by-id loader pattern as `load-king-works.ts`.
- Add `useShortStories()` and `useAdaptations()` composables for read-only lookups against the new tables, following the no-direct-`supabase.from()`-in-`.vue` convention.
- Extract shared table-column helpers (a sortable-header builder, a boolean-flag cell renderer, a type-label formatter) from the current `/works` table implementation so all three pages build consistent columns without duplicating that logic — each page renders Nuxt UI's `UTable` directly rather than through a wrapper component (a wrapper was tried and dropped; see design.md).
- Refactor `/works` to build its columns with the shared helpers instead of its current one-off versions, with no change to its visible behavior (same columns, search, and filters as today).
- Add `/short-stories`: a page listing `king_short_stories`, columns title / original publish year / type / Dark Tower flag, searchable by title, sortable by title and original publish year, filterable by type.
- Add `/adaptations`: a page listing `adaptations`, columns title / release year / type, searchable by title, sortable by title and release year, filterable by type.
- Verify `supabase-conventions` still matches whatever is decided while writing the migrations, and update the skill doc if anything drifts.

**Out of scope**: `user_adaptations` and `user_short_story_reads` (they depend on these five tables existing first) — planned as a separate follow-up change. `king_works` is untouched.

## Capabilities

### New Capabilities

- `king-short-stories`: canonical short story bibliography (`king_short_stories`) plus its links to the collections that contain each story (`king_short_story_collections`) — public read, seed-file-driven, no runtime writes.
- `adaptations`: canonical screen adaptations (`adaptations`) plus their links to source King works (`adaptation_works`) and source short stories (`adaptation_short_stories`) — public read, seed-file-driven, no runtime writes.
- `short-stories-browsing`: the `/short-stories` page — a sortable, filterable table of the short story bibliography.
- `adaptations-browsing`: the `/adaptations` page — a sortable, filterable table of adaptations.

### Modified Capabilities

- None. `/works`' externally visible behavior (columns, search, filters, sorting) is unchanged — its migration to the new shared table component is an implementation detail covered in `design.md` and `tasks.md`, not a requirements change, so `works-browsing`'s spec is not modified.

## Impact

- **New migrations**: `supabase/migrations/` — create the five tables, enable RLS, add public-read-only policies.
- **Seed loading**: a loader script per new table (or a generalized version of `load-king-works.ts`) that upserts from the existing `supabase/seed/*_seed.json` files.
- **New composables**: `app/composables/useShortStories.ts`, `app/composables/useAdaptations.ts`.
- **New shared helpers**: table-column helpers (sortable header, flag cell, type-label formatter — see design.md) used by `/works`, `/short-stories`, and `/adaptations`. No shared table wrapper component; each page renders `UTable` directly.
- **Modified**: `app/pages/works/index.vue` (refactored onto the shared component, no behavior change).
- **New pages**: `app/pages/short-stories/index.vue`, `app/pages/adaptations/index.vue`.
- **Docs**: `.claude/skills/supabase-conventions/SKILL.md`, reviewed and updated if migration-writing surfaces any drift from what's documented.
