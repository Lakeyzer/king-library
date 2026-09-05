## 1. Database: slugs for works and adaptations

- [x] 1.1 Add a migration that adds `slug text` (nullable first) to `king_works` and `adaptations`, backfills it for existing rows by slugifying `title` (lowercase, diacritics stripped, non-alphanumerics collapsed to single hyphens, trimmed), then alters both columns to `not null unique`; verify with `supabase db reset` locally (per `supabase-conventions`) that both tables end up with a unique, populated `slug` for every seeded row
- [x] 1.2 Update `supabase/seed/king_works.json` and `supabase/seed/adaptations_seed.json` (and whichever loader script writes them, e.g. `load-king-works.ts`/`load-bibliography.ts`) so every row carries an explicit `slug`, and the loader errors on a duplicate slug instead of silently inserting one; verify by re-running the seed loader and confirming no duplicate-slug or missing-slug rows
- [ ] 1.3 Push the migration to hosted Supabase (per the project's release process — requires explicit go-ahead before writing to hosted) before this change merges to `main`

## 2. Data access: fetch a single work/adaptation by slug

- [x] 2.1 Add `fetchKingWorkBySlug(slug)` to `useKingWorks` returning one row (or `null` when no match) with the same fields as `fetchKingWorks`, plus `slug`; verify by calling it in a scratch page/console against a known and an unknown slug
- [x] 2.2 Add `fetchAdaptationBySlug(slug)` to `useAdaptations` returning one adaptation (or `null`) plus its linked King work(s) and short story(ies) (joining `adaptation_works`/`adaptation_short_stories`), with `slug` included; verify against an adaptation with links, one without, and an unknown slug
- [x] 2.3 Add a way to fetch adaptations based on a given King work id (for the work-detail sidebar) and short stories in a given collection work id (for the collection sidebar), on `useAdaptations`/`useShortStories` respectively; verify each against a work with results and a work with none

## 3. External enrichment: Open Library and TMDb

- [x] 3.1 Add a composable that fetches live Open Library work detail (at minimum a description) given an Open Library work key, returning `null` on any failure rather than throwing; verify against a real work key and a deliberately invalid one
- [x] 3.2 Add `server/api/tmdb/[mediaType]/[id].get.ts` that reads a server-only TMDb API key from runtime config and proxies TMDb's "get details" endpoint for that media type/id, returning `null`/404 passthrough on failure; add `TMDB_API_KEY` to `runtimeConfig` (server-only) in `nuxt.config.ts` and to `.env`; verify by calling the route directly with a known TMDb id/media type and an invalid one
- [x] 3.3 Add a composable that calls the new TMDb server route given a TMDb id/media type, returning `null` on failure; verify it resolves for a seeded adaptation with a `tmdb_id` set

## 4. Reading-status: expanded display mode

- [x] 4.1 Add a `mode?: "compact" | "expanded"` prop to `app/components/book/ReadingActions.vue` (default `"compact"`), keeping the existing `UFieldGroup` (primary button + dropdown) template under `compact`; verify every existing call site (works list page) still renders unchanged
- [x] 4.2 Add the `expanded` template branch rendering each currently-available action (per the existing `primaryState`/`dropdownItems` logic) as its own `UButton`, wired to the same handlers/modals as today; verify manually for all four reading states (neutral, want-to-read, currently-reading, read) that the expected buttons appear and each produces the same effect as its compact-mode equivalent

## 5. Shared UI: linkable list items and sidebar connections

- [x] 5.1 Add an optional `to` prop to `BibliographyListItem` that wraps the thumbnail+title content in a `NuxtLink` when set, leaving the `#actions` slot outside the link; verify a list item with `to` navigates on click without the actions slot's buttons triggering navigation
- [x] 5.2 Add a `detailPathPrefix` prop to `BibliographyBrowsePage`, extend its generic item constraint to include `slug: string`, and pass `to="${detailPathPrefix}/${item.slug}"` down to `BibliographyListItem`; update `works/index.vue` and `adaptations/index.vue` to pass `detailPathPrefix="/works"` / `"/adaptations"`; verify clicking a list item on each browsing page navigates to that item's (not-yet-built) detail route
- [x] 5.3 Add `components/detail/ConnectionList.vue` (`<DetailConnectionList>`) rendering a heading plus a compact vertical list of rows (thumbnail, title, optional `NuxtLink`), used for adaptations-on-a-work, works/short-stories-on-an-adaptation, and short-stories-in-a-collection; verify it renders correctly with a linked item, an unlinked (short story) item, and an empty list (renders nothing per the specs' "no connections" scenarios)

## 6. Detail layout

- [x] 6.1 Add `app/layouts/detail.vue` reusing `CoreAppHeader`/`CoreAppFooter` around a `UPage`, with the layout's default slot as `UPage`'s main content and an `aside` named slot rendered inside `UPageAside` in `UPage`'s `#right` slot; verify on a throwaway page that main content and aside both render side by side on desktop width and stacked on mobile width

## 7. Work detail page

- [x] 7.1 Add `app/pages/works/[slug].vue` using the `detail` layout: fetch via `fetchKingWorkBySlug`, `createError({ statusCode: 404 })` on no match, and render title, type, publish date, cover, and Dark Tower/Bachman flags; verify visiting a known work's URL and an unknown slug (expect Nuxt's error page)
- [x] 7.2 Add the Open Library enrichment section using the 3.1 composable, shown only when data resolves, hidden (not stuck loading) when the work has no Open Library key or the fetch fails; verify against a work with a key, a work without one
- [x] 7.3 In the page's aside slot, list adaptations based on this work via `DetailConnectionList` (2.3), each linking to `/adaptations/[slug]`; when `type === "collection"`, also list its short stories via `DetailConnectionList` (2.3), unlinked; verify with a work that has adaptations, a collection work, and a plain work with neither
- [x] 7.4 Render `BookReadingActions` with `mode="expanded"` for the signed-in user on the work's own id, shown only when signed in; verify signed-in and signed-out states

## 8. Adaptation detail page

- [x] 8.1 Add `app/pages/adaptations/[slug].vue` using the `detail` layout: fetch via `fetchAdaptationBySlug`, `createError({ statusCode: 404 })` on no match, and render title, type, release year, poster, and note when set; verify visiting a known adaptation's URL and an unknown slug
- [x] 8.2 Add the TMDb enrichment section using the 3.3 composable, shown only when data resolves, hidden when the adaptation has no `tmdb_id` or the fetch fails; verify against an adaptation with a TMDb id, one without
- [x] 8.3 In the page's aside slot, list the King work(s) this adaptation is based on via `DetailConnectionList`, each linking to `/works/[slug]`, and any short stories it's based on, unlinked; verify with an adaptation based on a work, one based on a short story, and a universe-only adaptation with neither

## 9. End-to-end verification

- [x] 9.1 Walk through: works list → a work's detail page → one of its adaptations → back to a work it's based on, confirming every link lands on the right item and the reading-status expanded controls behave identically to the compact controls on the list page — **manual, in a running `pnpm dev`**: per project convention this session doesn't start the dev server itself; do this pass by hand
