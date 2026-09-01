## Context

First table in the project (see proposal.md - Why). Repo uses Nuxt 4's `app/` srcDir convention (`app/pages/`, `app/components/`), the `@nuxtjs/supabase` module (provides `useSupabaseClient()` client-side), and no `supabase/migrations/` directory yet. `supabase-conventions` fixes the `king_works` schema and RLS shape already; this design covers only how the seed data gets loaded and how the read path is wired up.

## Goals / Non-Goals

**Goals:**
- A migration that creates `king_works` with RLS locked to public-read-only, matching `supabase-conventions` exactly.
- A seed mechanism that is re-runnable without duplicating or reshuffling rows, since future tables (`user_books`) will eventually FK to `king_works.id`.
- A minimal, composable-mediated read path proving the table + RLS + client wiring all work together.

**Non-Goals:**
- Building `adaptations`, `profiles`, `user_books`, or any editions handling — out of scope per proposal.md.
- Any UI polish, pagination, or search on the dev page — it exists only to smoke-test the read path.
- Automating seed application in CI/CD — seeding here is a manual, developer-run step (matches "no runtime insert/update from the app" in `supabase-conventions`).

## Decisions

**Migration**: use `supabase migration new create_king_works_table`, producing a SQL file under `supabase/migrations/` that creates the table and enables RLS with a single `select`-only policy (`using (true)`), no write policies — this is the whole of the RLS surface per `supabase-conventions`.

**Seed file carries explicit ids**: `supabase/seed/king_works.json` includes a fixed `id` (uuid) per row, generated once and hardcoded, rather than letting the DB assign ids on insert. Alternative considered: let the DB generate ids and re-derive them from the loader's insert response — rejected because a delete-and-reinsert seeding strategy would then change ids on every reseed, silently breaking any future FK reference (e.g. `user_books.king_work_id`) if a dev reseeds after already creating test data. Stable, file-declared ids make the seed file the actual source of truth for identity, not just content.

**Loader script, not `supabase/seed.sql`**: a small TypeScript script (`supabase/seed/load-king-works.ts`) reads `king_works.json` and upserts each row (`on conflict (id) do update`) using a Supabase client authenticated with the service role key (bypasses RLS, per `supabase-conventions`). Run manually via a `pnpm` script (e.g. `pnpm seed:king-works`). Alternative considered: a plain `supabase/seed.sql` with hand-written `insert` statements, auto-applied on `supabase db reset` — rejected because `supabase-conventions` explicitly calls for a JSON seed file "not SQL insert statements hand-maintained inline in a migration," to keep the bibliography easy to diff and edit as plain data.

**Composable shape**: `useKingWorks()` wraps `useSupabaseClient()` (from `@nuxtjs/supabase`) and exposes a function returning all `king_works` rows ordered by `original_publish_year`. No `userId` parameter is needed (unlike composables that read per-user data) since this table has no ownership dimension.

**Dev page location**: `app/pages/dev/king-works-test.vue`, matching the existing `app/pages/` convention. Not linked from navigation; reachable only by direct URL during development.

## Risks / Trade-offs

- [Hardcoded seed ids could collide if two people generate rows independently before merging] → Low risk at this scale (3 rows, single contributor); revisit if the seed file grows or gains multiple editors.
- [Loader script requires the service role key in the local environment] → Document as a manual, local-only step; the key is never bundled into client code or the app runtime.
- [Dev page is a real route that ships to production unless removed] → Acceptable per proposal.md (explicitly a throwaway artifact); flagged here so it isn't mistaken for a permanent feature during review.

## Migration Plan

1. Run `supabase migration new create_king_works_table` and fill in the generated file with table creation + RLS policy.
2. Apply locally via `supabase db reset` (or `supabase migration up`) to verify the migration runs clean.
3. Add `supabase/seed/king_works.json` with the 3 seed rows and their hardcoded ids.
4. Add and run the loader script against the local database to populate the table.
5. Add `useKingWorks.ts` and the dev page, then verify in the browser that the 3 titles and years render.

No rollback complexity: this is an additive migration with no existing data or dependents to preserve.
