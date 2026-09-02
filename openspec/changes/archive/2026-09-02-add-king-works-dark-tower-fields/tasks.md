## 1. Migration

- [x] 1.1 Create a new Supabase migration file (`supabase migration new add_dark_tower_fields_to_king_works` or an equivalently timestamped file in `supabase/migrations/`) that adds `dark_tower boolean not null default false`, `bachman boolean not null default false`, and `dark_tower_relation text` (nullable) to `king_works`, and verify the file contains all three `alter table king_works add column ...` statements
- [x] 1.2 Apply the migration (pushed to the linked hosted project via `supabase db push` — local Docker stack unavailable) and verify `king_works` has the three new columns with the correct types, nullability, and defaults (confirmed via `supabase migration list` showing the migration applied remotely, and via the anon REST read below returning the new columns with their defaults)
- [x] 1.3 Verify the existing public-read RLS policy on `king_works` still covers the new columns (no policy change needed) by selecting the new columns as an anonymous/unauthenticated client and confirming the read succeeds (verified via REST API with the anon key — returned all 3 rows with `dark_tower`, `bachman`, `dark_tower_relation`)

## 2. Seed data

- [x] 2.1 Update `supabase/seed/king_works.json` to add `"dark_tower": false`, `"bachman": false`, and `"dark_tower_relation": null` to the 3 existing rows (Carrie, 'Salem's Lot, Cujo)
- [x] 2.2 Update the `KingWorkSeed` interface in `supabase/seed/load-king-works.ts` to include `dark_tower: boolean`, `bachman: boolean`, and `dark_tower_relation: string | null`, and verify the loader script still runs cleanly against the migrated database (ran against the hosted project — upserted 3 rows with no type errors)

## 3. Documentation

- [x] 3.1 Update the `king_works` schema table in `.claude/skills/supabase-conventions/SKILL.md` to add rows for `dark_tower`, `bachman`, and `dark_tower_relation`, and verify the documented schema matches the migration column-for-column
