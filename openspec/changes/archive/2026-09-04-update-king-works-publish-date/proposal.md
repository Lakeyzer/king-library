## Why

`king_works.original_publish_year` only records a year, but the maintainer has now sourced exact original publish dates for every work and updated `supabase/seed/king_works.json` accordingly. Storing the full date lets the works list sort chronologically within a year (e.g. two 1974 releases in their actual order) instead of only by year, while the year still shown to visitors can be derived from that date instead of stored redundantly.

## What Changes

- **BREAKING**: Replace `king_works.original_publish_year` (int, not null) with `king_works.publish_date` (date, not null) via a migration that drops the old column and adds the new one.
- Reload the `king_works` seed data (now carrying `publish_date` instead of `original_publish_year` per row) into local Supabase.
- Update `useKingWorks()` to select/order by `publish_date` and expose it on the `KingWork` type in place of `original_publish_year`.
- Update the `/works` page so the displayed year is derived from `publish_date` (year component), while sorting "by year" actually orders by the full `publish_date` underneath — so same-year works still sort correctly relative to each other. The end-user-facing sort label stays "Release year" / "year"; only the underlying sort key changes.
- Extend `BibliographyBrowsePage` with a way to sort by a different value than the one displayed as the year, so the works page can pass `publish_date` as the sort key without changing the short-stories/adaptations pages, which keep sorting by the same int year they display.
- Regenerate `app/types/database.types.ts` for the `king_works` table shape.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `king-works`: canonical King works now store an exact publish date instead of an original publish year.
- `works-browsing`: the works list's displayed year is derived from the stored publish date, and its "sort by year" control orders by the full publish date rather than by year alone.

## Impact

- `supabase/migrations/` — new migration dropping `original_publish_year`, adding `publish_date date not null`.
- `supabase/seed/king_works.json` — already updated (out of scope for this change) with `publish_date` per row.
- `app/composables/useKingWorks.ts` — `KingWork` type, select/order columns.
- `app/pages/works/index.vue` — derive displayed year from `publish_date`, pass a publish-date sort key.
- `app/components/BibliographyBrowsePage.vue` — new optional prop to decouple the displayed year from the sort key.
- `app/types/database.types.ts` — regenerated `king_works` row types.
- Any other reader of `king_works.original_publish_year` (none found outside the files above).
