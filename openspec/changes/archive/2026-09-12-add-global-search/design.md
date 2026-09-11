## Context

See proposal.md - Why. The three source composables (`useKingWorks`, `useShortStories`, `useAdaptations`) already fetch their entire table in one call and return plain arrays; none currently expose a query/filter parameter. Nuxt UI's `UCommandPalette` (see `references/recipes/overlays.md` in the `nuxt-ui` skill) is built for exactly this shape: a dialog with a search input and results grouped into labeled sections.

## Goals / Non-Goals

**Goals:**
- Decide how search data is loaded and cached across dialog opens.
- Decide how matching is performed so it satisfies the spec's case-insensitive substring requirement precisely.
- Decide the shape fed into `UCommandPalette` and how a selection navigates.

**Non-Goals:**
- Server-side or database-level search (e.g. Postgres full-text search) - out of scope while the catalog is small enough for client-side filtering.
- Any shared cross-page caching of works/short stories/adaptations beyond this feature's own composable.

## Decisions

### Fetch all three lists once, on first dialog open, then cache in module state
Fetching happens lazily the first time the visitor opens the dialog (not eagerly on app boot), and the results are kept in `useState` so reopening the dialog doesn't refetch.
- Alternative considered: eager fetch on app mount - rejected, it would add three queries to every page load for a feature most visits won't use.
- Alternative considered: refetch on every open - rejected, the bibliography is effectively static within a session, so repeated round trips buy nothing.

### Filter manually against the query rather than relying on `UCommandPalette`'s built-in filtering
The composable computes the three groups reactively from the current search term using a case-insensitive substring check (`title.toLowerCase().includes(query.toLowerCase())`), and passes only matching items into `UCommandPalette`'s `:groups`. The component's own fuzzy filtering is not used for this.
- Rationale: the spec calls for literal substring matching, not fuzzy/ranked matching. Filtering ourselves makes the result set predictable and matches the spec's scenarios directly.

### One composable (`useGlobalSearch`) composes the existing domain composables
`useGlobalSearch` calls `useKingWorks().fetchKingWorks`, `useShortStories().fetchShortStories`, and `useAdaptations().fetchAdaptations` rather than querying Supabase directly, and exposes a reactive search term plus the computed, categorized groups.
- Keeps every Supabase call inside a composable per the project's core conventions, and avoids duplicating query logic that already exists.

### Empty query shows no groups at all
When the search term is empty, the dialog renders no category groups (not three empty ones). Groups appear only once the term is non-empty and at least the matching pass has run.
- Matches the spec's "Empty query -> no results are displayed yet" scenario as a fully empty state rather than three empty headers.

### Category → route mapping and icons
Each result item carries a `to` matching its detail route (`/works/[slug]`, `/short-works/[slug]`, `/adaptations/[slug]`), letting `UCommandPalette` handle navigation and dialog close via its normal item-selection behavior. Each group uses a distinct icon (works: `i-lucide-book`, short stories: `i-lucide-file-text`, adaptations: `i-lucide-clapperboard`) so the three categories are visually distinguishable at a glance. The header trigger is an icon-only `UButton` (`i-lucide-search`, ghost/neutral, `aria-label="Search"`) placed in `AppHeader`'s `#right` template ahead of the color mode toggle.

## Risks / Trade-offs

- [Full-table fetch on first open could get slower as the bibliography grows] → Mitigation: the canonical King bibliography is curated and small; revisit with server-side search only if this becomes measurably slow.
- [Fetching all three lists again here duplicates what each index page already fetches independently] → Mitigation: consistent with the existing per-page fetch pattern in this codebase; introducing shared caching across pages is a separate concern, not part of this change.
