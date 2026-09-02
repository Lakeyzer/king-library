## 1. Default layout

- [x] 1.1 Create `app/layouts/default.vue` containing `UHeader`, a `UMain > UContainer > UPage` wrapper around `<slot />`, and `UFooter`, moving the header/footer content (logo, `TemplateMenu`, color mode button, GitHub link) out of `app/app.vue` unchanged; verify `app/layouts/default.vue` exists and Nuxt's generated `layouts.d.ts` lists `default`.
- [x] 1.2 Simplify `app/app.vue` to `<UApp><NuxtLayout><NuxtPage /></NuxtLayout></UApp>`, removing the now-moved header/footer markup; verify `pnpm dev` renders the home page with header and footer visible and no duplicated chrome.

## 2. Page layout wiring

- [x] 2.1 Add `definePageMeta({ layout: 'default' })` to `app/pages/index.vue`; verify the home page still renders with the layout's header/footer and page content unchanged.

## 3. King works data fetch

- [x] 3.1 Extend `useKingWorks`'s `select(...)` call to include `dark_tower` and `bachman`, and extend the `KingWork` interface with `dark_tower: boolean` and `bachman: boolean`; verify `pnpm typecheck` passes and `/dev/king-works-test` still renders without errors.

## 4. Works page

- [x] 4.1 Create `app/pages/works.vue` with `definePageMeta({ layout: 'default' })`, fetching works via `useKingWorks` through `useAsyncData` and rendering them in a `UTable` with columns for title and original publish year; verify navigating to `/works` shows a row per King work from `king_works`.
- [x] 4.2 Enable sorting on the title and original-publish-year columns only; verify clicking each column header toggles ascending/descending order and other columns are not sortable.
- [x] 4.3 Add a search input bound to a ref that filters the table's visible rows to titles containing the entered text (case-insensitive); verify typing a partial title narrows the table and clearing the input restores all rows.
- [x] 4.4 Add Bachman and Dark Tower filter checkboxes (checked restricts to that flag's true works, unchecked applies no restriction) and a type filter dropdown (options derived from the distinct `type` values in the fetched works, plus an "all types" option), all bound to refs and combined with the search term in one computed that produces the table's `:data`; verify each filter in isolation restricts rows to the matching value, and verify search + all three filters combined together narrow to the intersection.
- [x] 4.5 Add `type`, Bachman flag, and Dark Tower flag as additional (non-sortable) columns to the works table — `type` as plain text, the two flags as a checkbox-style indicator (a disabled checkbox reflecting the boolean value), not Yes/No text; verify all five columns (title, release year, type, Bachman, Dark Tower) render for every row and only title/release year remain sortable.
- [x] 4.6 Add a type-label-formatting function (underscores → spaces, each word capitalized) and apply it to both the type filter dropdown's option labels and the table's Type column; verify a value like `childrens_book` displays as "Childrens Book" in both places and stays consistent if a new type value appears in the data.

## 5. Documentation

- [x] 5.1 Update `CLAUDE.md`'s Project Structure section to document `app/layouts/` (Nuxt layouts; only `default` exists for now) alongside the existing `app/`/`pages/`/`components/` entries; verify the section lists it accurately against the actual directory.

## 6. Verification

- [x] 6.1 Run `pnpm lint` and `pnpm typecheck` and confirm both pass with no new errors. (`pnpm typecheck` passes cleanly; `pnpm lint` is clean for every file this change touches — remaining failures are pre-existing debt in `nuxt.config.ts`, `supabase/seed/load-king-works.ts`, `app/pages/dev/king-works-test.vue`, and 3 pre-existing lines in `useKingWorks.ts`, none introduced by this change.)
- [x] 6.2 Manually walk through `/`, `/works`, and `/dev/king-works-test` in the browser (light and dark mode) confirming the layout renders consistently on `/` and `/works`, and that `/dev/king-works-test` is unaffected.
