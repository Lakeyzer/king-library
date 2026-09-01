## 1. Database migration

- [x] 1.1 Run `supabase migration new create_king_works_table` and verify the generated file appears under `supabase/migrations/`
- [x] 1.2 In the generated migration, create `king_works` (`id` uuid PK default `gen_random_uuid()`, `title` text, `type` text, `original_publish_year` int, `open_library_work_key` text nullable) and verify the SQL matches the schema in the `supabase-conventions` skill
- [x] 1.3 In the same migration, enable RLS on `king_works` and add a single `select` policy (`using (true)`) with no insert/update/delete policies, and verify by reading the migration file that no write policy exists
- [x] 1.4 Apply the migration (no local Docker stack available; pushed to the linked hosted project via `supabase db push` per user direction) and verify it runs without error — confirmed via `supabase migration list`

## 2. Seed data

- [x] 2.1 Create `supabase/seed/king_works.json` with 3 rows (Carrie/1974, 'Salem's Lot/1975, Cujo/1981), each `type: "novel"`, its Open Library work key, and a hardcoded uuid `id`, and verify the file is valid JSON with exactly 3 entries
- [x] 2.2 Add `supabase/seed/load-king-works.ts`, a script that reads `king_works.json` and upserts each row (on conflict `id`) via a Supabase client using the service role key — ran against the linked hosted DB (no local stack available), logged "Upserted 3 king_works rows."
- [x] 2.3 Add a `pnpm seed:king-works` script to `package.json` that runs the loader, and verify `pnpm seed:king-works` populates `king_works` with exactly the 3 seeded rows — confirmed via REST query
- [x] 2.4 Re-run `pnpm seed:king-works` a second time and verify the table still has exactly 3 rows with unchanged ids (idempotent upsert) — second run also upserted the same 3 rows, no duplicates

## 3. Read path

- [x] 3.1 Add `app/composables/useKingWorks.ts` exposing a function that fetches all `king_works` rows via `useSupabaseClient()`, ordered by `original_publish_year`, and verify it type-checks (`pnpm typecheck` or equivalent) — passes with exit code 0
- [x] 3.2 Add `app/pages/dev/king-works-test.vue` that calls `useKingWorks()` and renders each work's title and year as plain text, and verify by visiting `/dev/king-works-test` in the browser that all 3 seeded titles and years appear — confirmed via `nuxt dev`, all 3 titles/years present in rendered HTML
- [x] 3.3 Verify anonymous (logged-out) access to `/dev/king-works-test` also renders all 3 rows, confirming the public-read RLS policy is in effect — confirmed with an unauthenticated request (no session cookie); required disabling `@nuxtjs/supabase`'s default global auth-redirect (`supabase.redirect: false` in `nuxt.config.ts`), which was blocking every route for anonymous visitors app-wide — done per explicit user direction, see proposal.md Impact
