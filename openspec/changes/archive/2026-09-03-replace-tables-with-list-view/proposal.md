## Why

The works, adaptations, and short-stories browsing pages currently render Nuxt UI `UTable` grids, which the user finds unappealing. A custom list component — a vertically stacked list whose items are each laid out horizontally (cover image left, title and metadata right) — better fits a bibliography-browsing experience and gives each row room for future per-item action buttons that a table's column layout doesn't comfortably support.

## What Changes

- **BREAKING**: Remove the `UTable`-based grid layout from `/works`, `/adaptations`, and `/short-stories`, replacing it with a shared list component: items stack vertically (top to bottom), each item laid out horizontally internally. The table view is no longer available on these pages.
- Introduce a reusable list-item layout: cover/poster thumbnail on the left; on the right, the title, and below it a metadata row containing the release year and type grouped at the leading edge, justified (`justify-between`) against an actions area reserved at the trailing edge for future per-item buttons.
- Existing search (title substring), type filtering, Bachman/Dark Tower flag filtering (works only), and sort-by-title/sort-by-release-year behavior are preserved exactly — only the presentation changes, not the underlying filter/sort logic.
- Since list items have no table header row to click for sorting, an explicit sort control (e.g., a field selector plus direction toggle) replaces the current column-header sort affordance.
- The reserved actions area ships empty in this change — no functional buttons (add to collection, mark read/watched, etc.) are wired up, since those features don't exist yet. This change only establishes the layout space for them.
- Short stories have no cover/poster data source today; their list items will show the existing generic placeholder image (book icon) in the image slot for visual consistency with works and adaptations.
- Bachman and Dark Tower flags remain filterable via their existing checkboxes (works only) but are no longer visually indicated on each list item — the metadata row shows only release year and type. This means short stories' Dark Tower flag, which was only ever displayed and never filterable, is no longer surfaced anywhere in the short-stories UI.
- The three pages share a new generic `BibliographyBrowsePage` component that owns the filter bar, sort control, and list rendering, since that UI was otherwise duplicated nearly identically across `/works`, `/adaptations`, and `/short-stories`. Each page is reduced to fetching its data and supplying a handful of per-domain accessors (release year field, image source, and — for works — the extra Bachman/Dark Tower filter controls via a slot).
- `app/utils/tableHelpers.ts`'s `UTable`-specific helpers (`sortableHeader`, `flagIndicator`) are retired since there is no longer a table to attach them to; `formatTypeLabel` is reused unchanged.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `works-browsing`: replace the table-based layout requirements with a vertically stacked list layout, each item laid out horizontally (image left / title + metadata right, reserved actions area); preserve sort/search/type-filter/flag-filter/lazy-load-cover behavior
- `adaptations-browsing`: replace the table-based layout requirements with a vertically stacked list layout, each item laid out horizontally; preserve sort/search/type-filter/lazy-load-poster behavior
- `short-stories-browsing`: replace the table-based layout requirements with a vertically stacked list layout, each item laid out horizontally (placeholder image, since no cover data source exists); preserve sort/search/type-filter behavior

## Impact

- **Code**: `app/pages/works/index.vue`, `app/pages/adaptations/index.vue`, `app/pages/short-stories/index.vue` (remove `UTable` usage, reduced to data-fetching plus a thin `BibliographyBrowsePage` usage); new shared components `app/components/BibliographyListItem.vue` (no badges) and `app/components/BibliographyBrowsePage.vue` (filter bar, sort control, list shell); `app/utils/tableHelpers.ts` (remove `UTable`-specific helpers, keep `formatTypeLabel`)
- **Unaffected**: `app/composables/useKingWorks.ts`, `useAdaptations.ts`, `useShortStories.ts` (data fetching unchanged); `app/utils/coverImages.ts` and `app/components/ImageThumbnail.vue` (reused as-is); Supabase schema (no migration needed)
- **Dependencies**: none added or removed — still built on Nuxt UI primitives (buttons, inputs, selects), just without `UTable`
