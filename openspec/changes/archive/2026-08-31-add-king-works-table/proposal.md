## Why

The app has no canonical bibliography yet. Every other feature (collections, wishlist, read tracking, stats) depends on a `king_works` table existing as the source of truth for "what counts as a King book." This change establishes that table, seeds it with an initial set of works, and proves it end-to-end with a minimal read path (composable + throwaway page) before any collection features are built on top of it.

## What Changes

- Add a `king_works` table via Supabase migration: `id` (uuid PK), `title` (text), `type` (text), `original_publish_year` (int), `open_library_work_key` (text, nullable).
- Enable RLS on `king_works` with a public SELECT policy (`using (true)`) and no INSERT/UPDATE/DELETE policies — matches the seed-file-driven, read-only-at-runtime pattern in `supabase-conventions`.
- Add `supabase/seed/king_works.json` with 3 seed rows: Carrie (1974), 'Salem's Lot (1975), Cujo (1981) — all `type: novel`, each with its Open Library work key.
- Add a loader/seed mechanism that applies `king_works.json` into the table (per the "seed files applied via `supabase db seed` or a small loader script" convention).
- Add `composables/useKingWorks.ts` exposing a function to fetch all `king_works` rows.
- Add a throwaway dev page (`pages/dev/king-works-test.vue`) that calls the composable and renders each work's title and year as plain text, to visually confirm the table, RLS policy, and composable work together.

## Capabilities

### New Capabilities
- `king-works`: canonical Stephen King bibliography storage (schema, RLS, seed data) and a minimal read composable to fetch it.

### Modified Capabilities
(none — first capability introduced in this repo)

## Impact

- **Database**: new migration adding `king_works` table + RLS policy; no changes to existing tables (none exist yet).
- **Seed data**: new `supabase/seed/king_works.json`, checked into the repo.
- **App code**: new `composables/useKingWorks.ts`; new dev-only page `pages/dev/king-works-test.vue`. Also modified `nuxt.config.ts` to set `supabase.redirect: false`, disabling `@nuxtjs/supabase`'s default global auth-redirect middleware (it was gating every route, including the anonymous-readable dev page, behind a login that didn't yet exist) — done per explicit user direction after this was discovered during implementation, since the app should not require auth app-wide by default.
- **Scope explicitly excluded**: no `adaptations`, `profiles`, `user_books`, or `user_adaptations` tables; no editions; no styling, pagination, or search on the dev page; the dev page is throwaway and not linked from app navigation.
