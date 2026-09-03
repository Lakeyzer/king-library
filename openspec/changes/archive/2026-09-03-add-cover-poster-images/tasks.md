## 1. Schema migrations

- [x] 1.1 Create migration adding nullable `cover_id` (integer) to `king_works` via `supabase migration new add_cover_id_to_king_works`, and verify `supabase db reset` (or targeted migration run) applies cleanly against local Supabase
- [x] 1.2 Create migration adding nullable `tmdb_poster_path` (text) to `adaptations` via `supabase migration new add_tmdb_poster_path_to_adaptations`, and verify it applies cleanly alongside 1.1

## 2. Backfill scripts

- [x] 2.1 Add `supabase/seed/backfill-cover-ids.ts`: for each row in `king_works.json` with an `open_library_work_key` and no `cover_id`, fetch `https://openlibrary.org/works/{key}.json`, set `cover_id` to `covers[0]` if present else `null`, write the updated JSON back to disk with a small delay between requests; verify by running it against local seed data and diffing `king_works.json` for expected `cover_id` values on a few known works (e.g. Carrie/OL81626W)
- [x] 2.2 Add `supabase/seed/backfill-tmdb-posters.ts`: for each row in `adaptations_seed.json` with a `tmdb_id` + `tmdb_media_type` and no `tmdb_poster_path`, call TMDb's `/movie/{id}` or `/tv/{id}` (per media type) using an API key from the environment, set `tmdb_poster_path` from the response's `poster_path` (or `null` if absent), write the updated JSON back with a small delay between requests; verify by running it locally and diffing `adaptations_seed.json` for a few known entries (e.g. Carrie/tmdb_id 7340)
- [x] 2.3 Document the required TMDb credential (e.g. `TMDB_API_KEY`) in the gitignored admin env file used by hosted seed scripts (per `supabase-conventions`), and verify the backfill script errors clearly if the env var is missing rather than making an unauthenticated call

## 3. Load backfilled data locally

- [x] 3.1 Run both backfill scripts against local seed JSON, review the git diff of `king_works.json` and `adaptations_seed.json` for sanity (spot-check a handful of rows, confirm nonfiction/screenplay/unreleased works land as `null`)
- [x] 3.2 Reseed local Supabase (`pnpm seed:king-works`, `pnpm seed:bibliography`) and verify via a quick query that `cover_id` / `tmdb_poster_path` are populated on the expected rows

## 4. Composables

- [x] 4.1 Add `cover_id: number | null` to the `KingWork` interface and `select(...)` list in `app/composables/useKingWorks.ts`, and verify `pnpm typecheck` (or equivalent) passes
- [x] 4.2 Add `tmdb_poster_path: string | null` to the `Adaptation` interface and `select(...)` list in `app/composables/useAdaptations.ts`, and verify types pass

## 5. Shared image URL helper

- [x] 5.1 Add `app/utils/coverImages.ts` exporting `getOpenLibraryCoverUrl(coverId, size)` (`'S' | 'M' | 'L'`) and `getTmdbPosterUrl(posterPath, size)` (`'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'original'`), each returning the composed URL string; verify with a small unit test or manual call covering both a valid id/path and confirm the constants match the URL patterns in design.md
- [x] 5.2 ~~Add `image: { domains: [...] }` to `nuxt.config.ts`~~ — superseded: `covers.openlibrary.org` redirects to a dynamic Internet Archive mirror host per request, which a static domain allowlist can't cover (confirmed via `curl` — `ipx` rejected the redirected `archive.org` host, and the redirect target's own URL independently returns 200). Switched `<NuxtImg>` to `provider="none"` in `ImageThumbnail.vue` instead (both sources already serve pre-sized images, so `ipx` processing added no value); `nuxt.config.ts` registers `image: { none: {} }` so the prop type-checks. See design.md decision 6. Confirmed working in-browser (user testing)

## 6. Works table thumbnail

- [x] 6.1 Add an image column to the `columns` array in `app/pages/works/index.vue` that renders a `<NuxtImg>` (size `-S`/`-M`, lazy loading) built via `getOpenLibraryCoverUrl(row.original.cover_id, 'S')` when `cover_id` is present
- [x] 6.2 Render a generic book-icon placeholder (Nuxt UI icon) in the same column slot when `cover_id` is null, and add an `@error` fallback on `<NuxtImg>` so a failed load also falls back to the placeholder icon rather than a broken image
- [x] 6.3 Manually verify in the browser: works with a cover show a thumbnail, works without one (e.g. a nonfiction/screenplay title) show the placeholder icon, and the rest of the table (sort/search/filters) still functions

## 7. Adaptations table thumbnail

- [x] 7.1 Add an image column to the `columns` array in `app/pages/adaptations/index.vue` that renders a `<NuxtImg>` (size `w92`/`w154`, lazy loading) built via `getTmdbPosterUrl(row.original.tmdb_poster_path, 'w154')` when `tmdb_poster_path` is present
- [x] 7.2 Render a generic film-reel-icon placeholder (Nuxt UI icon) in the same column slot when `tmdb_poster_path` is null, with the same `@error`-triggered fallback as 6.2
- [x] 7.3 Manually verify in the browser: adaptations with a poster show a thumbnail, any without one show the placeholder icon, and the rest of the table still functions

## 8. Documentation

- [x] 8.1 Update `.claude/skills/supabase-conventions/SKILL.md`: add `cover_id` to the `king_works` schema table and `tmdb_poster_path` to the `adaptations` schema table, and amend the "Cover images" section's "do not add a `cover_id` column anywhere" rule to explicitly carve out these two columns with the rationale from design.md (listing pages vs. one-at-a-time editions resolution)
