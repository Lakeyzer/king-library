## 1. Database migration

- [x] 1.1 Write a migration that drops `king_works.original_publish_year` and adds `king_works.publish_date date not null`, following the drop/add approach in design.md - Decisions
- [x] 1.2 Apply the migration locally via `supabase db reset` (picks up the migration and the already-updated seed file together) and verify `supabase migration list` shows local matching the new migration with no drift

## 2. Types and composable

- [x] 2.1 Regenerate `app/types/database.types.ts` from local Supabase and verify the `king_works` Row/Insert/Update shapes show `publish_date: string` in place of `original_publish_year: number`
- [x] 2.2 Update `KingWork` in `app/composables/useKingWorks.ts` to replace `original_publish_year: number` with `publish_date: string`, and update the `select`/`order` calls to use `publish_date`

## 3. Shared browse component

- [x] 3.1 Add an optional `sortValueOf: (item: T) => number | null` prop to `app/components/BibliographyBrowsePage.vue`; when provided, the "sort by year" comparison uses `sortValueOf(item)` instead of `yearOf(item)`, falling back to `yearOf` when `sortValueOf` is not passed — verify `/short-stories` and `/adaptations` still sort correctly with no prop changes on those pages

## 4. Works page

- [x] 4.1 Update `app/pages/works/index.vue`'s `year-of` accessor to derive the year from `work.publish_date` (implemented as `Number(work.publish_date.slice(0, 4))` rather than `new Date(...).getFullYear()`, since the latter parses date-only strings as UTC and can misreport the year for early-month dates in negative-UTC-offset timezones) instead of reading `original_publish_year`
- [x] 4.2 Pass `sort-value-of` on `/works` as a timestamp derived from `work.publish_date` (`Date.parse(work.publish_date)`), and verify two works sharing a release year sort in actual publish-date order when "Release year" sort is ascending/descending
- [x] 4.3 Verify the displayed year, "Release year" sort label, and type/flag filters on `/works` all still render correctly against the reloaded seed data

## 5. Verification

- [x] 5.1 Manually confirm on `/works`: cover thumbnails, search, type filter, Bachman/Dark Tower filter, and the read-status split button are all unaffected by this change
- [x] 5.2 Confirm `/short-stories` and `/adaptations` pages are visually and behaviorally unchanged (they don't pass the new `sort-value-of` prop)
