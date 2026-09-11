## 1. Search composable

- [x] 1.1 Create `app/composables/useGlobalSearch.ts` that calls `useKingWorks().fetchKingWorks`, `useShortStories().fetchShortStories`, and `useAdaptations().fetchAdaptations`, caches the three lists in `useState` on first call, and exposes a `load()`/`ensureLoaded()` function - verify a manual call fetches once and a second call does not re-issue the Supabase queries (check via network tab or a temporary log)
- [x] 1.2 Add a reactive search term and a computed `groups` value that filters each cached list by case-insensitive substring match on `title`, returning no groups when the term is empty - verify with a quick unit test or manual check: empty term -> `[]`; a term matching only one domain -> only that group populated with matching items; a term matching all three -> all three groups populated
- [x] 1.3 Shape each group's items for `UCommandPalette` (`id`, `label` = title, `icon` per category, `to` = `/works/[slug]`, `/short-works/[slug]`, or `/adaptations/[slug]`) - verify generated `to` values match each domain's existing detail route pattern

## 2. Search dialog component

- [x] 2.1 Create `app/components/core/GlobalSearch.vue` using `UCommandPalette` bound to `useGlobalSearch`'s search term and groups, with group labels "Works", "Short Stories", "Adaptations" and per-category icons (`i-lucide-book`, `i-lucide-file-text`, `i-lucide-clapperboard`) - verify the dialog opens via a local `open` ref and typing filters results live
- [x] 2.2 Verify selecting a result navigates to its detail page and closes the dialog (manual check across one result from each category)

## 3. Header integration

- [x] 3.1 Add a search icon `UButton` (`i-lucide-search`, ghost/neutral, `aria-label="Search"`) to `AppHeader.vue`'s `#right` template, ahead of `UColorModeButton`, that opens `GlobalSearch` - verify the icon renders in the header and clicking it opens the dialog
- [x] 3.2 Confirm the header layout still fits at mobile width with the new icon present (manual check in a narrow viewport)

## 4. Verification

- [x] 4.1 Manually exercise the full flow: open the dialog from the header, search a query matching a work, a short story, and an adaptation, and confirm all three category groups appear with correct results and navigation from each lands on the right detail page
- [x] 4.2 Confirm a query matching only some categories still shows all three category labels, with unmatched categories empty
