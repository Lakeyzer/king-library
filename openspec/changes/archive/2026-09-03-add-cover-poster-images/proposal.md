## Why

The works and adaptations browsing tables (`/works`, `/adaptations`) are text-only. A cover/poster thumbnail per row makes both tables meaningfully more useful for visually scanning a bibliography or filmography, and both `king_works` and `adaptations` already carry the external identifiers (`open_library_work_key`, `tmdb_id` + `tmdb_media_type`) needed to resolve one.

## What Changes

- Add a nullable `cover_id` (integer) column to `king_works`, populated from Open Library's work-level `covers` array via a one-off backfill script that updates the `king_works.json` seed file (the checked-in source of truth), not the live database directly.
- Add a nullable `tmdb_poster_path` (text) column to `adaptations`, populated from TMDb's movie/TV detail endpoint via the equivalent backfill script against `adaptations_seed.json`.
- Add a shared cover/poster URL-building helper per domain (Open Library `-S`/`-M`/`-L` sizes; TMDb `w92`…`w500`/`original` sizes), composed client-side from the stored identifier — no binary image data or full URLs are ever persisted.
- Add a thumbnail column to the `/works` table (`app/pages/works/index.vue`) and the `/adaptations` table (`app/pages/adaptations/index.vue`), rendered with `<NuxtImg>` (already installed and registered), with a generic placeholder icon when the identifier is null.
- **Amend the existing `supabase-conventions` "Cover images" rule.** That rule says "do not add a `cover_id` column anywhere," written for the editions/bookshelf live-resolution case (one work at a time, in-memory cache, never persisted). This change deliberately carves out a narrower exception for canonical-bibliography *listing* pages, where dozens of rows render at once and per-row live fetches against Open Library are impractical/rate-limit-risky. The skill is updated to document `king_works.cover_id` / `adaptations.tmdb_poster_path` as the one sanctioned exception, while the original rule continues to hold everywhere else (still no `cover_id`/`cover_url` on `user_book_editions`, still no persisted TMDb data beyond this one column).

## Capabilities

### New Capabilities

None — this fits inside the existing `king-works`, `adaptations`, `works-browsing`, and `adaptations-browsing` capability boundaries.

### Modified Capabilities

- `king-works`: adds an optional cover identifier field to the canonical King work record and to the "retrieve all King works for display" requirement.
- `adaptations`: adds an optional poster-path identifier field to the canonical adaptation record and to the "retrieve all adaptations for display" requirement.
- `works-browsing`: the works table requirement now includes a cover thumbnail per row, with a defined placeholder behavior when no cover identifier exists.
- `adaptations-browsing`: the adaptations table requirement now includes a poster thumbnail per row, with the same placeholder behavior when no poster identifier exists.

## Impact

- **Migrations**: two new migration files (`king_works.cover_id`, `adaptations.tmdb_poster_path`), additive and nullable — no backfill required before deploy, no breaking change to existing rows or RLS (both tables keep their existing public-read, no-write policies).
- **Seed files**: `supabase/seed/king_works.json` and `supabase/seed/adaptations_seed.json` gain a new field per row, populated where resolvable, `null` where not (nonfiction/screenplay/unreleased works, adaptations TMDb has no poster for).
- **New backfill scripts**: `supabase/seed/backfill-cover-ids.ts` (Open Library) and `supabase/seed/backfill-tmdb-posters.ts` (TMDb), run manually against the seed JSON, not wired into the regular `seed:*` loaders — they mutate the seed file, then the existing `seed:king-works` / `seed:bibliography` scripts pick up the change normally.
- **New env var**: a TMDb API key/read-access-token is needed for the TMDb backfill script only (not the running app, since the app only ever composes a URL from a stored `poster_path` — it never calls TMDb itself).
- **Composables**: `useKingWorks()` and `useAdaptations()` select lists and TypeScript interfaces gain the new field.
- **Components**: `app/pages/works/index.vue` and `app/pages/adaptations/index.vue` gain an image column; a new small shared helper (e.g. `app/utils/coverImages.ts`) centralizes URL composition for both domains.
- **Dependencies**: none new — `@nuxt/image` is already installed and registered in `nuxt.config.ts`.
- **Docs**: `.claude/skills/supabase-conventions/SKILL.md` schema tables and "Cover images" section updated.
