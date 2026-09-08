## Context

`/works`, `/adaptations`, and `/short-stories` (`app/pages/**/index.vue`) currently share one pattern: fetch via a domain composable (`useKingWorks`, `useAdaptations`, `useShortStories`) into `useAsyncData`, hold `search`/`typeFilter`(/`bachmanFilter`/`darkTowerFilter` for works) as local refs, combine them in a `computed filtered*`, and render a `TableColumn[]` through Nuxt UI's `UTable`. Column-header sorting comes from `sortableHeader()` in `app/utils/tableHelpers.ts`, which builds a clickable header via TanStack Table's `column.toggleSorting()` — a mechanism tied entirely to `UTable`. See proposal.md - Why for the motivation to move off tables. Row images use the shared `ImageThumbnail.vue` + `coverImages.ts` (`getOpenLibraryCoverUrl`, `getTmdbPosterUrl`), which are UI-agnostic and carry over unchanged.

## Goals / Non-Goals

**Goals:**
- One shared, generic list-item component used by all three pages, so the layout (image left / title + metadata right) isn't implemented three times
- One shared, generic page-shell component owning the filter bar, sort control, and list rendering, since that UI is otherwise duplicated nearly identically across the three pages
- Preserve all existing search/filter/sort *behavior* exactly (see the three modified specs) — only the rendering changes
- Replace `UTable`'s column-header sort with an explicit sort control, centralized in the shared page-shell component rather than reimplemented per page
- Leave a real, reserved slot in the layout for future per-item action buttons, without inventing buttons this change doesn't need

**Non-Goals:**
- No new action buttons (add to collection, mark read/watched, edit) — those features don't exist yet; this change only reserves the layout space
- No change to data fetching, composables, or the Supabase schema
- No short-story cover image sourcing — short stories keep using the placeholder icon
- No visual indication of the Bachman/Dark Tower flags on a list item — they stay filterable via their existing checkboxes only

## Decisions

**Shared component: `app/components/BibliographyListItem.vue`.**
A single generic presentational component takes props for image (`src: string | null`, `placeholderIcon: string`), `title: string`, `releaseYear: number | null`, and `typeLabel: string`, plus a named `actions` slot for the reserved trailing area. No `badges` prop — flags are not visually represented on a list item (see Non-Goals). Alternative considered: three domain-specific components (`WorksListItem`, `AdaptationsListItem`, `ShortStoriesListItem`) — rejected because the layout is identical across domains and the only per-domain differences (image source) are already expressible as props, matching the user's request for "a custom list component" (singular).

**Layout**: the list container (`<ul>`) stacks its items vertically, top to bottom — one `BibliographyListItem` per row, in normal block flow (no horizontal scrolling, no grid/wrap). Each item's own root element is a horizontal flex row (`ImageThumbnail` on the left, a `flex-1` column on the right containing the title and a metadata row). The metadata row is `flex justify-between items-center`: a leading group (`flex items-center gap-2`) rendering release year and type label; a trailing `<slot name="actions" />` for future buttons. Rendered as a semantic `<ul>`/`<li>` list (not a generic `<div>` soup) for accessibility, replacing the table's implicit row semantics.

**Shared page shell: `app/components/BibliographyBrowsePage.vue`.**
Since all three pages otherwise duplicate the same page header, filter bar (search + type filter + sort control), and list-rendering markup nearly verbatim, this component owns that shell. It takes `title`/`description` (page header text), `items: T[]`, and a small set of accessor props needed because `title`/`type` are consistently named across all three domain types but year/image are not: `yearOf(item)`, `imageSrcOf(item)`, `imageAltOf(item)`, `placeholderIcon`, and `sortYearLabel` (e.g. "Release year" vs. "Original publish year", for the sort dropdown). It owns `search`/`typeFilter`/`sortBy`/`sortDir` state internally, derives `typeOptions` from `items`, and renders the filtered+sorted list as `BibliographyListItem`s. An optional `extraFilter(item) => boolean` prop and a named `extra-filters` slot let a page add its own filter controls (Works' Bachman/Dark Tower checkboxes) without the shell needing to know about them — the page owns those refs and folds them into the `extraFilter` predicate it passes down. Each page becomes: fetch via its composable, define its accessors, and render one `<BibliographyBrowsePage>` — replacing the ~90-line duplicated template each page had with a handful of props. Alternative considered: a `useBibliographyBrowse` composable that only centralizes the *state* (search/type/sort refs + filtered/sorted computed), leaving each page to render its own markup — rejected because the markup (filter bar layout, list rendering) was the larger and more error-prone duplication, and a composable alone wouldn't address the user's "reduce the template part of the pages" ask.

**Short stories image**: no cover data source exists (confirmed: `king_short_stories` has no image column). `BibliographyListItem` always receives a `placeholderIcon`; short stories' `imageSrcOf` returns `null` unconditionally so `ImageThumbnail` renders its existing placeholder path — no new fallback logic needed.

**Retiring `tableHelpers.ts`**: `sortableHeader` and `flagIndicator` are removed (both build `UTable`-specific vnodes via `h()` and have no non-table caller after this change). `formatTypeLabel` stays as-is and is reused by `BibliographyListItem`.

## Risks / Trade-offs

- **Losing `UTable`'s built-in keyboard/screen-reader table semantics** → Mitigate by using semantic list markup (`<ul>`/`<li>`) and labeling the sort control explicitly (`aria-label` on the select and toggle button).
- **Three pages must be migrated together to retire `tableHelpers.ts` cleanly** → Migrate all three pages in this change rather than partially, since a mixed table/list state has no user-facing benefit and the shared helpers are removed atomically.
- **`BibliographyBrowsePage`'s accessor-prop surface could balloon back into per-domain complexity if it tries to generalize too much** → Keep it to only the accessors that actually differ (year, image, optional extra filter); let `title`/`type` pass straight through since every domain type already names them identically, and keep the "add a filter checkbox" escape hatch to a single slot + predicate prop rather than a growing list of boolean props.

## Migration Plan

1. Build `app/components/BibliographyListItem.vue` (no `badges` prop; no page wiring yet).
2. Build `app/components/BibliographyBrowsePage.vue` on top of it (filter bar, sort control, list rendering; no page wiring yet).
3. Migrate `/works` (`app/pages/works/index.vue`): replace `columns`/`UTable` and the duplicated filter-bar template with a thin `<BibliographyBrowsePage>` usage, keeping the existing filter *logic* (Bachman/Dark Tower) but passing it through the `extra-filters` slot and `extraFilter` prop instead of inline markup.
4. Migrate `/adaptations` the same way.
5. Migrate `/short-stories` the same way.
6. Remove `sortableHeader`/`flagIndicator` from `app/utils/tableHelpers.ts` once no page references them.
7. Manual testing per CLAUDE.md testing workflow (dev server run by hand, not started automatically at the end of this task).

No data migration, no rollback concerns beyond a normal revert (pure front-end presentational change).
