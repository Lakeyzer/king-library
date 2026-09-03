## Context

`/works` (`app/pages/works/index.vue`) currently owns its own `UTable` setup end-to-end: it builds `TableColumn` definitions inline (including a hand-rolled sortable-header factory and a boolean-flag cell renderer via `h(UCheckbox, ...)`), and does search/filter narrowing itself via a local `computed`. Fetching goes through `useKingWorks().fetchKingWorks()`. There's no shared table logic yet — this change introduces it and needs `/works`, `/short-stories`, and `/adaptations` to all build consistent columns from it. See proposal.md - Why / What Changes for the product-level motivation.

## Goals / Non-Goals

**Goals:**
- Shared column-building helpers (sortable header, flag cell, type-label formatter) so all three pages build consistent columns without duplicating that logic — no shared table wrapper component, since a component that only forwarded `data`/`columns` straight to `UTable` added a layer of indirection without doing anything `UTable` doesn't already do.
- Search and type-filter narrowing follow the same pattern on all three pages (a page-level `computed`), so `/short-stories` and `/adaptations` behave consistently with `/works` for the filters they share.
- `/works` keeps its exact current behavior (columns, sort targets, filters) after the refactor — this is a structural change, not a behavior change, which is why no delta spec was written for `works-browsing`.
- Each page file stays thin: a data-fetching call plus column/filter config and its own `UTable` call.

**Non-Goals:**
- No change to how data is fetched (`useKingWorks`, `useShortStories`, `useAdaptations` stay separate, per-domain composables per `supabase-conventions`).
- No pagination, row-selection, or server-side sorting/filtering — the current `/works` page loads the full table client-side and this change preserves that.
- No visual/design-system change to how the table looks.
- `user_adaptations` / `user_short_story_reads` and any write-capable UI are out of scope (separate follow-up change).

## Decisions

### Shared column-building helpers; no wrapper table component
`app/components/DataTable.vue` was tried first: a thin wrapper around `UTable` taking `data`/`columns` props and passing them straight through. It added no behavior of its own — every page still needed direct access to `UTable`'s own props, so the wrapper was pure indirection with no upside. Removed; each page renders `<UTable :data="..." :columns="columns" />` directly.

What's actually shared is the column-*building* logic, kept as plain exported functions (not a component) in `app/utils/tableHelpers.ts`:
- `sortableHeader<T>(label)` — builds a `TableColumn<T>["header"]` that renders a sort-toggle button, used for every sortable column across all three pages.
- `flagIndicator(value)` — renders the disabled-checkbox cell used for boolean-flag columns (`/works`' Bachman/Dark Tower, `/short-stories`' Dark Tower).
- `formatTypeLabel(type)` — the shared type-label formatter (e.g. `short_story` → `Short Story`) used in both `type` cell rendering and building each page's type-filter dropdown options.

Each page still owns its own `columns: TableColumn<T>[]` array and its own `UTable` call — matching "each page stays thin: column config + a data-fetching call," just without an intermediate component that wasn't doing anything. This was also the pragmatic outcome of the alternative considered during the original design (pushing column definitions into a shared component via a generic `fields` descriptor) — that would have needed to abstract `UTable`'s `cell` renderer generically enough to cover a plain text cell, a formatted-label cell, and a checkbox cell, which is more indirection than three pages' worth of column arrays justify.

### Filter UI: page-owned wiring, no shared filter component
The search input, type-select, and boolean-checkbox filter controls look similar across all three pages, but the actual filter *sets* differ per page: `/works` has search + type + two boolean-flag checkboxes; `/short-stories` and `/adaptations` have search + type only (per the updated specs — both are now searchable by title, matching `/works`, in addition to the type filter each already had). Rather than a shared `<TableFilters>` component that would need to support every combination, each page wires its own `UInput`/`USelect`/`UCheckbox` controls directly in its template and does its own `computed` for narrowing `data` before passing it to `UTable` — the same pattern `/works` already used, now copied into the two new pages rather than abstracted. This keeps each page's filter set exactly matched to what its spec requires, with no unused controls and no shared-component surface to design around three different filter combinations.

### `/works` migrates onto the shared helpers in the same change
Per the proposal, `/works` is refactored to build its columns with `sortableHeader`/`flagIndicator`/`formatTypeLabel` as part of this change, rather than keeping its own inline copies. Its `computed` filtering logic (search + Bachman + Dark Tower + type) and its own `UTable` call are unchanged — only the column/header-construction logic moves to the shared helpers module.

### Seed loading: generalize the existing loader rather than five one-off scripts
`supabase/seed/load-king-works.ts` is a small, single-purpose script (read JSON, upsert by `id`, log a count). Rather than duplicating it five times, generalize it into one script that takes a table name + seed file path pair and runs the same upsert-by-id logic for each of the five new tables, run in dependency order so join tables load after the tables they reference exist: `king_short_stories` and `adaptations` first, then `king_short_story_collections`, `adaptation_works`, `adaptation_short_stories`. `king_works` stays untouched and out of scope, so the existing `load-king-works.ts` call site isn't required to change, but the new script should be structured so a future pass could fold it in without a rewrite.

## Risks / Trade-offs

- **[Risk] Seed loader ordering: FK violations if join tables are upserted before their referenced tables exist/are populated.** → Mitigation: explicit load order in the generalized script (parents before joins), and run it against a fresh local DB as part of verifying the migrations before considering the change done.
- **[Trade-off] Filtering stays client-side/page-owned rather than centralized in the component.** → Accepted: matches current `/works` behavior exactly, and the dataset sizes here (curated bibliography, not user data) don't need server-side filtering.
