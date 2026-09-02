## Why

The app currently has no reusable page shell — `app.vue` hardcodes the header/footer markup directly around `<NuxtPage />` — and no page exists yet for browsing the King bibliography beyond the throwaway `/dev/king-works-test` route. Introducing a Nuxt layout gives every future page a consistent shell, and a real `/works` page gives users their first way to browse, search, and filter the canonical King works list.

## What Changes

- Add a `default` Nuxt layout (`app/layouts/default.vue`) containing `UHeader`, a `UMain` > `UContainer` > `UPage` shell, and `UFooter`. This is the only layout for now.
- Simplify `app/app.vue` to keep `UApp` as the root provider and delegate page chrome to `<NuxtLayout><NuxtPage /></NuxtLayout>` instead of inlining `UHeader`/`UFooter` markup.
- Update `app/pages/index.vue` to explicitly use the `default` layout via `definePageMeta`.
- Add a new `app/pages/works.vue` page rendering all canonical King works in a `UTable`:
  - Columns: title, original publish year, type, Bachman flag, Dark Tower flag. Only title and original publish year are sortable.
  - Free-text search box filtering by title.
  - Checkbox filters for the `bachman` and `dark_tower` boolean flags — checked restricts to works with that flag true, unchecked applies no restriction on that flag.
  - A `type` filter as a dropdown listing every distinct type present in the data (plus an "all types" option).
- Extend `useKingWorks` to select the `type`, `dark_tower`, and `bachman` columns (in addition to the existing `id`, `title`, `original_publish_year`, `open_library_work_key`) so the works page has the fields it needs to render and filter.
- Document the `layouts/` directory in `CLAUDE.md`'s Project Structure section.

Out of scope: the `/dev/king-works-test` page is left as-is (it's a throwaway dev page, not part of this change); no new layouts beyond `default`; no pagination, row click-through, or `dark_tower_relation` display on `/works`.

## Capabilities

### New Capabilities
- `app-shell`: The default Nuxt layout (header, footer, page container) that pages opt into for consistent chrome.
- `works-browsing`: A public page listing all canonical King works with sorting, search, and filtering.

### Modified Capabilities
- `king-works`: "Retrieve all King works for display" is extended — application code fetching all King works for display must also be able to receive each work's type, Dark Tower flag, and Bachman flag (not just title and publish year).

## Impact

- **Affected code**: `app/app.vue`, `app/pages/index.vue`, new `app/layouts/default.vue`, new `app/pages/works.vue`, `app/composables/useKingWorks.ts`.
- **Affected docs**: `CLAUDE.md` (Project Structure section).
- **Dependencies**: none new — uses existing Nuxt UI components (`UHeader`, `UFooter`, `UContainer`, `UPage`, `UTable`) and the existing Supabase `king_works` table.
