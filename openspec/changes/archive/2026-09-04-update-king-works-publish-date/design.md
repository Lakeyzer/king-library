## Context

`king_works.original_publish_year` (int, not null) is being replaced by `publish_date` (date, not null). The seed file `supabase/seed/king_works.json` has already been updated by the maintainer to carry `publish_date` per row instead of `original_publish_year` — this change is scoped to the schema, the migration, and the app code that reads the column, not the seed content itself. See proposal.md - Why.

`BibliographyBrowsePage.vue` is a shared generic component used by `/works`, `/short-stories`, and `/adaptations`. Today it takes a single `yearOf` accessor used both to display the year on each list item and as the sort key when "sort by year" is active (`compareYear` in the component). Short stories and adaptations only have an int year (`original_publish_year`, `release_year`) and are not changing — only `/works` gains a full date.

## Goals / Non-Goals

**Goals:**
- Replace `original_publish_year` with `publish_date` in the `king_works` table, composable, and types.
- Derive the displayed year on `/works` from `publish_date` instead of storing a separate year.
- Sort "by year" on `/works` using the full `publish_date`, so same-year works order correctly, while the sort label and UI still read "year" (matches proposal.md - What Changes).
- Keep `/short-stories` and `/adaptations` behavior and props unchanged.

**Non-Goals:**
- Changing `king_short_stories.original_publish_year` (a separate table/column, not part of this change).
- Editing seed file contents — already done by the maintainer.
- Pushing the migration/reseed to hosted Supabase (follows the standard release-process go-ahead, not part of planning).

## Decisions

### Add a distinct sort-key accessor to `BibliographyBrowsePage`, decoupled from the displayed year

The component adds an optional `sortValueOf: (item: T) => number | null` prop. When provided, "sort by year" compares `sortValueOf(item)` instead of `yearOf(item)`; when omitted, sorting falls back to `yearOf` exactly as it does today. `/works` passes `sortValueOf` as the work's `publish_date` converted to a timestamp (`Date.parse`), while `yearOf` continues to return just the year for display. `/short-stories` and `/adaptations` pass nothing new and are unaffected.

**Alternatives considered:**
- *Make `yearOf` return the full date and format it for display separately.* Rejected — `yearOf`'s return value is also passed straight through to `BibliographyListItem`'s `release-year` prop for rendering; overloading it to also carry sort precision would mean either changing that prop's contract (touching all three pages) or reformatting inline, both messier than adding one optional prop.
- *Give `king_works` its own bespoke non-generic browse page.* Rejected — duplicates the shared search/filter/sort chrome for one column's worth of difference.

### Migration drops and adds in one file

A single migration does `alter table king_works drop column original_publish_year, add column publish_date date not null` (with a placeholder default only if needed to satisfy `not null` before the reseed — see Migration Plan). This mirrors how prior `king_works` migrations here are additive/single-purpose (see `20260902095238_add_dark_tower_fields_to_king_works.sql`, `20260903115744_add_cover_id_to_king_works.sql`).

**Alternatives considered:**
- *Two migrations (drop, then add).* Rejected — no intermediate state needs to be queryable, and it's the same seed-reload step either way.

## Risks / Trade-offs

- [`publish_date not null` fails on migrate if applied before the reseed, since existing local rows have no date] → Add the column nullable-first within the same migration transaction only if `supabase migration up` errors on a populated table; otherwise apply the migration to a freshly reset local DB and immediately reseed, per the standard local workflow (`supabase db reset` picks up the new migration + reseed together). Confirm which applies when running task 1.
- [A caller outside the four files identified in proposal.md - Impact still references `original_publish_year`] → Grep confirmed the only non-doc/non-archived references are `useKingWorks.ts`, `works/index.vue`, and `database.types.ts`; `king_short_stories`'s own `original_publish_year` is untouched and intentionally out of scope.

## Migration Plan

1. Write the migration (drop `original_publish_year`, add `publish_date date not null`).
2. Run `supabase db reset` locally so the migration and the already-updated seed file apply together (avoids the not-null-on-populated-table ordering issue above).
3. Verify locally via `supabase migration list` that local matches the new migration, then update `app/types/database.types.ts` (regenerate from local).
4. Hosted push follows the standard release-process go-ahead — not part of this planning change.
