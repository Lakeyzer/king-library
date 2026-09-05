## Why

Works and adaptations are currently only browsable as list items on `/works` and `/adaptations` — there is no page to land on for a single item, no way to see richer details pulled from Open Library or TMDb, and no way to see how items connect to each other (an adaptation's source work, a work's adaptations, a collection's short stories). Detail pages give each item a permanent, linkable place to expand on all of this.

## What Changes

- Add a work detail page at `/works/[slug]` showing the work's title and core details (type, publish date, Dark Tower/Bachman flags, cover), enriched with data fetched live from Open Library via the work's stored Open Library work key.
- Add an adaptation detail page at `/adaptations/[slug]` showing the adaptation's title and core details (type, release year, poster), enriched with data fetched live from TMDb via the adaptation's stored TMDb id/media type.
- Add a `slug` column to `king_works` and `adaptations` (unique, generated from title, backfilled for existing seed data) so detail pages have a stable, human-readable URL segment instead of routing on the raw UUID id.
- Make list items on `/works` and `/adaptations` link to their respective detail page.
- Add a new layout with a right-side connections sidebar, used by both detail pages: a work's sidebar shows its adaptations, and its short stories if the work is a collection; an adaptation's sidebar shows the King work(s) and/or short stories it's based on. Sidebar entries for works and adaptations link to their own detail pages; short story entries are shown but are not yet links (short story detail pages are a future feature).
- Extend `BookReadingActions` with an expanded render mode that shows reading-status actions as separate buttons (Want to Read / Start Reading / Finish / Mark as Read / Unmark, as applicable) instead of the compact primary-button-plus-dropdown used in list rows; the work detail page uses this expanded mode.

## Capabilities

### New Capabilities
- `work-details`: work detail page — route, live Open Library enrichment, and the connections it shows (adaptations, short stories when a collection).
- `adaptation-details`: adaptation detail page — route, live TMDb enrichment, and the connections it shows (source work(s) and/or short stories).

### Modified Capabilities
- `app-shell`: introduces a second layout (detail layout, with header/footer plus a main content area and a right-side connections sidebar), so the existing "default layout is the only layout" requirement no longer holds as stated.
- `king-works`: adds a unique `slug` column to canonical King works storage and a way to retrieve a single work by slug.
- `adaptations`: adds a unique `slug` column to canonical adaptation storage and a way to retrieve a single adaptation by slug.
- `reading-status`: adds an expanded display mode for the reading-status controls, presenting each available action as its own button instead of a compact primary-button-plus-dropdown.

## Impact

- **Database**: new migration adding `slug` to `king_works` and `adaptations`, plus a backfill of existing seed rows; seed loader/scripts updated to generate and persist slugs for future rows.
- **Composables**: `useKingWorks`/`useAdaptations` extended to fetch a single row by slug; new composables (or extensions) for live Open Library work lookups and live TMDb title lookups.
- **Routes**: new pages `app/pages/works/[slug].vue` and `app/pages/adaptations/[slug].vue`; existing `BibliographyListItem` usages in `works/index.vue` and `adaptations/index.vue` updated to link to the new routes.
- **Layouts**: new layout alongside `default` for pages with a right-side sidebar.
- **Components**: `BookReadingActions` gains a render-mode prop; new components for the connections sidebar content.
- **External APIs**: live calls to Open Library (public, keyless) and TMDb (requires an API key — needs a server-side route to avoid exposing the key to the client) introduced for the first time.
