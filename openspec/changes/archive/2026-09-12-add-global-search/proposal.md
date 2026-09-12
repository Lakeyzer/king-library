## Why

Right now the only way to find a specific work, short story, or adaptation is to browse its dedicated index page and scan or scroll. As the catalog grows this gets slower, and there's no way to jump straight to a title from anywhere else in the app. A single global search reachable from the header lets a visitor find any title across all three domains in one place.

## What Changes

- Add a search icon control to the header (trailing side, next to the color mode toggle) that opens a global search dialog.
- The dialog searches across King works, short stories, and adaptations by title (case-insensitive substring match) as the visitor types.
- Results are grouped into three always-labeled categories — Works, Short Stories, Adaptations — each showing its own matches (a category with no matches shows none, but the category itself isn't hidden).
- Selecting a result closes the dialog and navigates to that item's detail page (`/works/[slug]`, `/short-works/[slug]`, or `/adaptations/[slug]`).
- Search is title-only for this change; matching on author, description, or notes is out of scope.
- No keyboard shortcut (e.g. Cmd+K) is introduced in this change — the icon click is the only trigger.

## Capabilities

### New Capabilities
- `global-search`: Cross-domain search dialog that matches a query against work, short story, and adaptation titles, groups results by category, and navigates to the selected item.

### Modified Capabilities
- `app-shell`: Header gains a search entry point control on its trailing side that opens the global search dialog.

## Impact

- `app/components/core/AppHeader.vue`: add the search trigger icon button.
- New component(s) for the search dialog (e.g. `app/components/core/GlobalSearch.vue`) using Nuxt UI's `UCommandPalette`.
- New composable (e.g. `app/composables/useGlobalSearch.ts`) that combines `useKingWorks`, `useShortStories`, and `useAdaptations` to build the searchable, categorized result set — no new Supabase tables, columns, or RLS changes; all three source tables are already public bibliography data fetched in full by existing composables.
