## Why

A suggestion-box request: signed-in users want to narrow the browse pages down to what they have (or haven't) read or watched - e.g. "which King novels haven't I read yet?" or "which adaptations have I already seen?". Today the only way to answer that is to scroll the whole list scanning each item's status button.

## What Changes

- Add a status filter to the search/filter controls on `/works`, `/works-by-others`, and `/short-works`, offering "All", "Read", and "Unread".
- Add the equivalent status filter to `/adaptations`, offering "All", "Watched", and "Unwatched".
- The status filter is only shown to signed-in users; signed-out visitors see the pages exactly as today.
- The status filter combines with the existing title search, type filter, and each page's page-specific filter (Bachman / Dark Tower flag on `/works`, "Not in a collection" on `/short-works`), and feeds into the existing "No matches" empty state.
- The status filter defaults to "All" on every page load, so nothing is hidden until the user opts in.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `works-browsing`: adds a Read/Unread status filter for signed-in users, and includes it in the "filters and search combine" requirement.
- `adaptations-browsing`: adds a Watched/Unwatched status filter for signed-in users, and includes it in the "filters and search combine" requirement.
- `short-stories-browsing`: adds a Read/Unread status filter for signed-in users, and updates the "filters and search combine" requirement to cover it (and the existing "Not in a collection" filter it currently omits).
- `by-other-hands`: adds a Read/Unread status filter to the `/works-by-others` list for signed-in users, combining with its search and category filter.

## Impact

- `app/components/BibliographyBrowsePage.vue` - gains an optional, generic status-filter control rendered alongside the type filter.
- `app/pages/works/index.vue`, `app/pages/works-by-others/index.vue`, `app/pages/short-works/index.vue`, `app/pages/adaptations/index.vue` - each passes a per-item "is read/watched" predicate built from state the page already loads (`userBooksByWorkId`, `readShortStoryIds`, `userAdaptationsByAdaptationId`).
- No database, RLS, migration, or seed changes; no new Supabase queries. Pure client-side filtering over already-fetched data.
