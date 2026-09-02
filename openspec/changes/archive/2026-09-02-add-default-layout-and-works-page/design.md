## Context

`app/app.vue` currently renders `UApp` wrapping inline `UHeader`/`UFooter` markup directly around `<NuxtPage />` (see proposal.md - Why). `app/pages/index.vue` is the starter template's landing page content with no `definePageMeta`. `useKingWorks` only selects `id, title, type, original_publish_year, open_library_work_key`; the `dark_tower`, `bachman`, and `dark_tower_relation` columns exist in `king_works` (added in migration `20260902095238_add_dark_tower_fields_to_king_works.sql`) but aren't fetched yet. The King bibliography is small (a few dozen curated works), fetched once via `useAsyncData`.

## Goals / Non-Goals

**Goals:**
- Move header/footer chrome out of `app.vue` into a reusable `layouts/default.vue`.
- Render `/works` from a single client-side fetch, with sort/search/filter applied in the browser.

**Non-Goals:**
- No server-side pagination, sorting, or filtering endpoints — dataset size doesn't warrant it.
- No layout switching mechanism (e.g. auth vs. public layouts) — only `default` exists.
- No changes to `/dev/king-works-test`.

## Decisions

**App shell split**: `app.vue` keeps `UApp` as the sole root provider (theming, toasts, etc.) and reduces its template to `<UApp><NuxtLayout><NuxtPage /></NuxtLayout></UApp>`. `layouts/default.vue` owns `UHeader`, `UFooter`, and a `UMain > UContainer > UPage` wrapper around `<slot />`. The existing header content (logo, `TemplateMenu`, color mode button, GitHub link) and footer content move from `app.vue` into the layout unchanged.
  - *Alternative considered*: keep chrome in `app.vue` and add layouts only for future variants. Rejected — the proposal specifically asks for the shell to live in a layout now, and `NuxtPage`-level chrome can't be opted out of per-page the way a layout can.

**Page layout selection**: `index.vue` gets `definePageMeta({ layout: 'default' })` even though `default` is Nuxt's automatic fallback, per the proposal's explicit instruction to update the index page to use the layout. `works.vue` also declares it explicitly for consistency, since a project with only one layout benefits from that declaration being self-documenting rather than implicit.

**Filtering/search/sort strategy**: fetch the full works list once (existing `useAsyncData` pattern), then derive the visible rows with a single `computed` that applies the title search (case-insensitive substring match), the `bachman` filter, the `dark_tower` filter, and the `type` filter together, feeding the result into `UTable`'s `:data`. Sorting is delegated to `UTable`'s built-in column sorting (TanStack Table under the hood), enabled only on the title and original-publish-year columns.
  - *Alternative considered*: wire search/filters through `UTable`'s built-in global/column filter state. Rejected for now — combining a free-text search with three independent filters is simpler to reason about as one `computed` than composing multiple TanStack filter functions, and keeps the filter UI (search input + selects) decoupled from table internals.

**Bachman/Dark Tower filter UI**: each filter is a checkbox (`UCheckbox`) rather than a three-state select — checked restricts the table to that flag's true works, unchecked applies no restriction on that flag.
  - *Alternative considered*: a three-state All/Yes/No select, which additionally supported explicitly excluding that flag's works (a "No" state). Superseded — excluding by flag was never an explicit requirement, and a checkbox is the more familiar, lighter-weight control for a simple "show works with this flag" filter.

**Works table columns**: in addition to title and original publish year, the table displays `type`, `bachman`, and `dark_tower` as columns. `type` renders as plain text (formatted per the type label formatting decision below); `bachman`/`dark_tower` render as a checkbox-style indicator (a disabled checkbox reflecting the boolean value) rather than Yes/No text. All three are display-only — not sortable — consistent with the works-browsing spec limiting sorting to title and release year.
  - *Alternative considered*: keep the table to just title/year and rely solely on the filter controls to convey type/Bachman/Dark Tower status. Superseded — the table now surfaces these fields directly so a visitor can see them without having to filter.
  - *Alternative considered for the flag columns*: a Yes/No badge or text label. Superseded — a checkbox-style indicator reads faster at a glance across many rows and matches the checkbox filters directly above the table.

**Type filter UI and options source**: the type filter is a dropdown whose options are derived from the distinct `type` values present in the fetched works (plus an "all types" option), computed from the already-loaded data rather than hardcoded.
  - *Alternative considered*: hardcode the known type values (e.g. novel, short story, novella, screenplay). Rejected — deriving options from the fetched data keeps the filter correct without a code change if the seed data's type vocabulary changes.

**Type label formatting**: raw `type` values (e.g. `childrens_book`, `short_story`) are formatted for display by a small function — underscores replaced with spaces, each word capitalized (e.g. `childrens_book` → "Childrens Book") — applied consistently to both the type filter dropdown's option labels and the table's Type column, so the two never disagree.
  - *Alternative considered*: a static `Record<string, string>` dictionary mapping each known type value to its label. Rejected — it would reintroduce the exact hardcoding the type-filter-options decision above avoids, and would silently miss a new type value added to the seed data rather than formatting it automatically.

**`useKingWorks` fetch scope**: extend the existing `select(...)` to add `dark_tower` and `bachman` (needed for filtering) and `type` (already selected — no change needed there, it's already in the select list). `dark_tower_relation` is left unfetched since no requirement in `works-browsing` displays it.

## Risks / Trade-offs

- [All filtering/sorting happens client-side after fetching every row] → Acceptable at current and expected bibliography size (tens to low hundreds of works); revisit with server-side querying if the canonical list grows enough to matter.
- [Checkbox filters can no longer explicitly exclude Bachman/Dark Tower works — only "show only" or "no filter"] → Accepted; excluding by flag was never a stated requirement, and the two-state checkbox matches the filter pattern visitors expect from a boolean flag.
