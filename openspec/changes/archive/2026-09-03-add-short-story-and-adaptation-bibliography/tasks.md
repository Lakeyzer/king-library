## 1. Migrations: new tables

- [x] 1.1 Create migration adding `king_short_stories` (`id`, `title`, `type`, `original_publish_year` nullable, `first_published_in` nullable, `dark_tower` default false, `dark_tower_relation` nullable) with RLS enabled and a public-read-only policy; verify `supabase db reset` (or equivalent local apply) runs the migration without error and `select * from king_short_stories` succeeds as anon.
- [x] 1.2 Create migration adding `adaptations` (`id`, `title`, `type`, `release_year`, `tmdb_id` nullable, `tmdb_media_type` nullable, `is_universe_only` default false, `notes` nullable) with RLS enabled and a public-read-only policy; verify as in 1.1.
- [x] 1.3 Create migration adding `king_short_story_collections` (`id`, `short_story_id` FK → `king_short_stories.id`, `king_work_id` FK → `king_works.id`, `order_in_collection` nullable, unique on `(short_story_id, king_work_id)`) with RLS enabled and a public-read-only policy; verify FK constraints reject a row referencing a nonexistent `short_story_id`/`king_work_id`.
- [x] 1.4 Create migration adding `adaptation_works` (`id`, `adaptation_id` FK → `adaptations.id`, `king_work_id` FK → `king_works.id`, unique on `(adaptation_id, king_work_id)`) with RLS enabled and a public-read-only policy; verify as in 1.3.
- [x] 1.5 Create migration adding `adaptation_short_stories` (`id`, `adaptation_id` FK → `adaptations.id`, `short_story_id` FK → `king_short_stories.id`, unique on `(adaptation_id, short_story_id)`) with RLS enabled and a public-read-only policy; verify as in 1.3.
- [x] 1.6 Confirm none of the above policies include INSERT/UPDATE/DELETE grants and that no triggers were added to any of the five tables, per the seed-file-driven/read-only-at-runtime pattern; verify by re-reading each migration file.

## 2. Seed loading

- [x] 2.1 Generalize `supabase/seed/load-king-works.ts` into a reusable loader (table name + seed file path in, upsert-by-`id` out), leaving the existing `king_works` load path and behavior unchanged; verify the generalized loader still successfully loads `king_works.json` into `king_works`.
- [x] 2.2 Add loader calls for `king_short_stories` (from `king_short_stories_seed.json`) and `adaptations` (from `adaptations_seed.json`), run before their respective join tables; verify row counts in each table match the seed file's array length.
- [x] 2.3 Add loader calls for `king_short_story_collections` (from `king_short_story_collections_seed.json`), `adaptation_works` (from `adaptation_works_seed.json`), and `adaptation_short_stories` (from `adaptation_short_stories_seed.json`), run after their referenced tables are loaded; verify each loads without FK violations and row counts match the seed files.
- [x] 2.4 Run the full seed load against a local Supabase instance end to end and verify no errors and expected row counts across all five new tables.

## 3. Composables

- [x] 3.1 Add `app/composables/useShortStories.ts` with a `KingShortStory` type and a `fetchShortStories()` read against `king_short_stories`, following the shape of `useKingWorks.ts`; verify it returns typed rows including `title`, `type`, `original_publish_year`, `dark_tower`.
- [x] 3.2 Add `app/composables/useAdaptations.ts` with an `Adaptation` type and a `fetchAdaptations()` read against `adaptations`, following the shape of `useKingWorks.ts`; verify it returns typed rows including `title`, `type`, `release_year`.
- [x] 3.3 Confirm neither composable is called from more than composables/pages (no direct `supabase.from(...)` in any `.vue` file) per `supabase-conventions`; verify by grepping `.vue` files for `supabase.from`.

## 4. Shared table helpers

- [x] 4.1 ~~Extract a generic `DataTable` component~~ Remove `app/components/DataTable.vue` — it only forwarded `data`/`columns` to `UTable` with no added behavior (see design.md's "Shared column-building helpers; no wrapper table component" decision); verify no page imports or references `DataTable` anymore.
- [x] 4.2 Extract the `sortableHeader` header-builder used by `/works` into a shared, importable helper (module export or small composable) so all three pages build sortable column headers the same way; verify `/works`' title/year columns still toggle sort direction after switching to the shared helper.
- [x] 4.3 Extract the boolean-flag cell renderer (`flagIndicator`, the disabled `UCheckbox` cell) into a shared, importable helper alongside the sortable header helper, since `/works`' Dark Tower/Bachman columns and `/short-stories`' Dark Tower column both need it; verify the rendered cell still shows a disabled checkbox matching the row's boolean value.

## 5. Refactor `/works` onto the shared helpers

- [x] 5.1 Update `app/pages/works/index.vue` to call `UTable` directly (`<UTable :data="filteredWorks" :columns="columns" />`) instead of the removed `DataTable`, keeping its columns built via the shared `sortableHeader`/`flagIndicator` helpers and its existing search/Bachman/Dark Tower/type filtering `computed` logic unchanged; verify the page still renders identically (all columns, checkboxes, dropdown, search) with `pnpm dev`.
- [x] 5.2 Manually verify in the browser that `/works` sorting (title, release year), search, and all three filters (Bachman, Dark Tower, type) still behave exactly as before, after switching off `DataTable`.

## 6. `/short-stories` page

- [x] 6.1 Update `app/pages/short-stories/index.vue` to render `UTable` directly instead of the removed `DataTable`, and add a title search input (`UInput`, mirroring `/works`') wired into the page's existing `computed` alongside the type filter, per the updated `short-stories-browsing` spec; verify the page compiles and renders.
- [x] 6.2 Manually verify in the browser that `/short-stories` lists every seeded short story, sorts correctly by title and by original publish year, the type filter narrows to the selected type (and an "all types" option restores the full list), the search input narrows to matching titles (and clearing it restores the full list), and search + type filter combine correctly when both are active.

## 7. `/adaptations` page

- [x] 7.1 Update `app/pages/adaptations/index.vue` to render `UTable` directly instead of the removed `DataTable`, and add a title search input (`UInput`, mirroring `/works`') wired into the page's existing `computed` alongside the type filter, per the updated `adaptations-browsing` spec; verify the page compiles and renders.
- [x] 7.2 Manually verify in the browser that `/adaptations` lists every seeded adaptation, sorts correctly by title and by release year, the type filter narrows to the selected type (and an "all types" option restores the full list), the search input narrows to matching titles (and clearing it restores the full list), and search + type filter combine correctly when both are active.

## 8. Docs

- [x] 8.1 Re-read `.claude/skills/supabase-conventions/SKILL.md` against the migrations actually written (column types, nullability, constraint names, RLS policy shape) and update the skill doc wherever the implementation diverged from what it currently documents; verify by diffing the skill's schema tables against the final migration files, and note in the change's summary whether any drift was found.

  Drift found and fixed: (1) the RLS section's public-read table list omitted `king_short_stories` and `king_short_story_collections`, even though the Schema section already documented both as seed-file-driven/no-runtime-CRUD — added them to the RLS bullet and example. (2) the "Migrations & seed files" section listed seed file names without the `_seed.json` suffix the actual files in `supabase/seed/` use, and referenced `supabase db seed` rather than the loader script pattern actually used — corrected to the real file names and to reference `loader.ts`/`load-bibliography.ts`. Column types, nullability, and constraint shape in the Schema section matched the migrations exactly, no changes needed there.
