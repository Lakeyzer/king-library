## 1. Shared list-item component

- [x] 1.1 Update `app/components/BibliographyListItem.vue` to drop the `badges` prop entirely (no visual flag indicators) — keep `src`, `placeholderIcon`, `title`, `releaseYear`, `typeLabel`, and the `actions` slot; verify with a project-wide search that nothing still passes a `badges` prop

## 2. Shared browse-page component

- [x] 2.1 Create `app/components/BibliographyBrowsePage.vue` owning the page header (`title`/`description` props), the filter bar (search input, type-filter dropdown derived from `items`, sort-field dropdown + direction toggle), and the `<ul>` of `BibliographyListItem`s — driven by `items: T[]` plus accessor props `yearOf`, `imageSrcOf`, `imageAltOf`, `placeholderIcon`, and `sortYearLabel`, with an optional `extraFilter` predicate prop and a named `extra-filters` slot for domain-specific filter controls — verify by wiring `/works` against it end-to-end (task 3.1)

## 3. Migrate `/works`

- [x] 3.1 Rewrite `app/pages/works/index.vue` to fetch works via `useKingWorks`/`useAsyncData` and render `<BibliographyBrowsePage>`, passing `yearOf`/`imageSrcOf` (via `getOpenLibraryCoverUrl`)/`imageAltOf`/`placeholderIcon="i-lucide-book"`/`sortYearLabel="Release year"`, and putting the existing Bachman/Dark Tower `UCheckbox` controls in the `extra-filters` slot wired to local `bachmanFilter`/`darkTowerFilter` refs folded into an `extraFilter` predicate — verify the works page renders one list item per canonical work with no badges shown
- [x] 3.2 Confirm existing search, Bachman filter, Dark Tower filter, type filter, and sort-by-title/release-year (in both directions) still work and combine together exactly as before — verify against each scenario in `specs/works-browsing/spec.md`
- [x] 3.3 Confirm cover images lazy-load and fall back to the placeholder on a missing cover id or a failed image load — verify against the works-browsing image scenarios

## 4. Migrate `/adaptations`

- [x] 4.1 Rewrite `app/pages/adaptations/index.vue` to fetch adaptations via `useAdaptations`/`useAsyncData` and render `<BibliographyBrowsePage>`, passing `yearOf`/`imageSrcOf` (via `getTmdbPosterUrl`)/`imageAltOf`/`placeholderIcon="i-lucide-film"`/`sortYearLabel="Release year"`, no `extra-filters` content — verify the adaptations page renders one list item per canonical adaptation
- [x] 4.2 Confirm existing search, type filter, and sort-by-title/release-year (in both directions) still work and combine together — verify against each scenario in `specs/adaptations-browsing/spec.md`
- [x] 4.3 Confirm poster images lazy-load and fall back to the placeholder on a missing poster path or a failed image load — verify against the adaptations-browsing image scenarios

## 5. Migrate `/short-stories`

- [x] 5.1 Rewrite `app/pages/short-stories/index.vue` to fetch short stories via `useShortStories`/`useAsyncData` and render `<BibliographyBrowsePage>`, passing `yearOf` (nullable, sorts to the end in either direction)/`imageSrcOf` returning `null` unconditionally/`placeholderIcon="i-lucide-book-open"`/`sortYearLabel="Original publish year"`, no `extra-filters` content (Dark Tower flag is no longer displayed or filterable here) — verify the short stories page renders one list item per canonical short story with a placeholder image
- [x] 5.2 Confirm existing search, type filter, and sort-by-title/original-publish-year (in both directions, nulls last) still work and combine together — verify against each scenario in `specs/short-stories-browsing/spec.md`

## 6. Cleanup

- [x] 6.1 Remove `sortableHeader` and `flagIndicator` from `app/utils/tableHelpers.ts`, keeping `formatTypeLabel`; verify with a project-wide search that no remaining file imports the removed helpers
- [x] 6.2 Run the project's type check / lint (per the project's existing `pnpm` scripts) and confirm it passes with no `UTable`/`TableColumn` references left in the three pages, no `badges` prop usage, and no leftover per-page filter-bar/sort markup duplicated outside `BibliographyBrowsePage`
