## Context

See `proposal.md` - Why/What Changes for motivation. Relevant current state:

- `king_works` and `adaptations` are seed-file-driven, read-only-at-runtime tables (`supabase/seed/king_works.json`, `supabase/seed/adaptations_seed.json`), loaded via `supabase/seed/loader.ts` + `load-king-works.ts` / `load-bibliography.ts`, run through `pnpm seed:king-works[:hosted]` / `pnpm seed:bibliography[:hosted]`. The JSON files are the source of truth; the DB is just what those scripts upsert into.
- `.claude/skills/supabase-conventions/SKILL.md` currently states, under "Cover images": *"Do not add a `cover_url` or `cover_id` column anywhere"* - written for `user_book_editions` / bookshelf display, where a cover is resolved live (fetch Open Library's work JSON on demand, cache in memory, never persisted) because that's a one-work-at-a-time lookup.
- `@nuxt/image` is already installed and registered in `nuxt.config.ts`, but has no `image.domains` (or provider) configuration yet - a bare install with no remote-image allowlist.
- `/works` and `/adaptations` are flat `UTable` listings (`app/pages/works/index.vue`, `app/pages/adaptations/index.vue`) with no per-work or per-adaptation detail page in the codebase today.
- `adaptations` already stores `tmdb_id` + `tmdb_media_type` per row (seeded with real TMDb ids), even though `CLAUDE.md` still calls TMDb "not yet confirmed" as the adaptation data source - in practice it's already the one in use.

## Goals / Non-Goals

**Goals:**
- Persist just enough identifier data (`cover_id`, `tmdb_poster_path`) to render a thumbnail per row in both browsing tables without a live API call per page view.
- Keep the seed JSON files as the single source of truth - the backfill scripts write to the JSON, never directly to the DB.
- Draw a narrow, explicit boundary around the "no cover_id column" rule so it doesn't quietly rot: it still holds everywhere except these two specific canonical-listing columns.

**Non-Goals:**
- Editions-level cover art (`user_book_editions`) - untouched, still resolved live per the existing skill section.
- A detail/expanded view for a work or adaptation - none exists yet; the `-L`/`w500`/`original` size guidance from the proposal is documented in the helper for whenever such a view is built, not wired into any page now.
- Building a general-purpose image proxy/cache - out of scope per the proposal; if Open Library/TMDb delivery ever proves unreliable, that's a future change.

## Decisions

**1. Backfill scripts mutate the seed JSON, not the database.**
Both `king_works` and `adaptations` follow the existing "seed-file-driven, read-only at runtime" pattern (see `supabase-conventions`). A script that wrote `cover_id` straight into the hosted DB would create exactly the drift the seed-file convention exists to prevent (JSON and DB no longer agreeing on what the canonical data is). Instead:
- `supabase/seed/backfill-cover-ids.ts` reads `king_works.json`, and for every row with an `open_library_work_key` and no `cover_id`, fetches `https://openlibrary.org/works/{key}.json`, takes `covers[0]` if present, and writes `cover_id` back into that row in the JSON file. Rows with no `covers` array (or a fetch error) get `cover_id: null` and are left for a future rerun.
- `supabase/seed/backfill-tmdb-posters.ts` does the same against `adaptations_seed.json`, calling TMDb's `/movie/{id}` or `/tv/{id}` (per `tmdb_media_type`) and writing `poster_path` back as `tmdb_poster_path`.
- Neither script is wired into `seed:*` - they're one-off maintenance scripts a developer runs, reviews the JSON diff of, commits, and then re-runs the normal `seed:king-works` / `seed:bibliography` (and their `:hosted` counterparts, subject to the existing "ask before writing to hosted" rule) to load the result.
- *Alternative considered*: write directly to the DB via the service-role client, matching `loader.ts`'s upsert pattern. Rejected because it would make the DB briefly (or permanently, if someone forgets to backport it) diverge from the JSON, and the whole point of the seed-file pattern is that the JSON is diffable, reviewable, and reproducible from scratch.

**2. Narrow, explicit amendment to the "no cover_id column" rule.**
Rather than silently contradicting the existing skill text, `supabase-conventions` is updated to say the rule holds everywhere *except* `king_works.cover_id` and `adaptations.tmdb_poster_path`, with a one-line rationale: canonical-bibliography listings render many rows at once, where a live per-row fetch (the pattern used for the one-work-at-a-time editions/bookshelf case) doesn't scale and risks Open Library/TMDb rate limits. This keeps the skill internally consistent instead of leaving a rule that's now half-true.

**3. One shared helper module per image domain, not per-component URL strings.**
`app/utils/coverImages.ts` exports:
- `getOpenLibraryCoverUrl(coverId: number, size: 'S' | 'M' | 'L')` → `https://covers.openlibrary.org/b/id/{coverId}-{size}.jpg`
- `getTmdbPosterUrl(posterPath: string, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'original')` → `https://image.tmdb.org/t/p/{size}{posterPath}`
This mirrors the existing convention (`getEditionCoverUrl` / `getWorkCoverUrl` already live as the pattern to follow for Open Library URLs) and gives the future detail-view work a ready-made larger-size call.

**4. TMDb base image URL is a hardcoded constant, not fetched from `/configuration` at render time.**
TMDb's docs note the base URL is effectively static; calling `/configuration` on every page load to re-derive a value that doesn't change would add a network round-trip (and an API key requirement in the running app) for no practical benefit. The constant is documented with a comment noting the assumption, so it's a deliberate, revisitable choice rather than an oversight. TMDb is only called from the backfill script (which already needs an API key to look up poster paths) - the running app never calls TMDb.

**5. Placeholder is an icon, not a placeholder image asset.**
Both tables render a Nuxt UI icon (book icon for works, film-reel icon for adaptations) inside the same thumbnail slot when the identifier is null, rather than shipping a static placeholder image file. Simpler (no new asset to add/maintain) and consistent with the rest of the UI already using Nuxt UI icons elsewhere.

**6. `<NuxtImg>` uses `provider="none"` (a direct, unproxied `<img>`) instead of the default `ipx` provider.**
The original plan was `image.domains` allowlisting both hosts for the default `ipx` provider. In practice, `covers.openlibrary.org` 302-redirects every request to a dynamic Internet Archive mirror subdomain (e.g. `ia801601.us.archive.org` — different per request/shard), and `ipx`'s HTTP storage driver validates the domain allowlist against the *final* redirected host, not the URL it was given. A static allowlist entry can't cover an unpredictable per-request subdomain, so `covers.openlibrary.org` in `image.domains` never actually works (confirmed via direct testing: `IPX_FORBIDDEN_HOST` naming `archive.org`, not the allowlisted host). TMDb's `image.tmdb.org` doesn't redirect and would have worked fine through `ipx`, but since both sources already serve pre-sized images (`-S/-M/-L`, `w92/w154`), `ipx`'s resizing/optimization was never buying anything here — so both are switched to `provider="none"`, which renders a plain `<img :src>` with no IPX proxying, no domain check, and no dependence on which host a redirect lands on. `nuxt.config.ts` registers `image: { none: {} }` (needed only to get `"none"` accepted by the `provider` prop's generated TypeScript type — the provider itself is always built in); no `image.domains` config is needed anymore.

## Risks / Trade-offs

- **Backfill scripts can go stale** (a work's cover added to Open Library after the script last ran stays `null` until someone reruns it) → acceptable: same staleness profile as the rest of the seed-file data, fixed by rerunning the script, not a live-sync guarantee.
- **Rate limiting on both external APIs during backfill** → mitigate with a small delay between requests in each script (both run against a bounded, small dataset - the full King bibliography/filmography - not per-user-request volume).
- **TMDb backfill needs a new API credential** → it's a script-only, developer-machine credential (like the existing `SUPABASE_SERVICE_ROLE_KEY` for seeding), never present in the deployed app's Vercel env.
- **The skill amendment could be misread as "add cover_id columns wherever convenient"** → mitigated by naming the exact two columns explicitly in the amended rule rather than loosening it in general terms.

## Migration Plan

1. Add the two additive, nullable-column migrations (`king_works.cover_id` int, `adaptations.tmdb_poster_path` text) - no data loss risk, no RLS change (both tables keep existing public-read/no-write policies).
2. Run both backfill scripts locally against the seed JSON files, review the diffs.
3. Apply migrations + reseed locally (`supabase db reset` or targeted `seed:*`), verify both tables end to end.
4. Follow the standard release process (`CLAUDE.md` - Release process): push migrations and the updated seed data to hosted Supabase, with explicit go-ahead, before merging to `main`.
5. Rollback, if needed: dropping either column is safe and non-breaking (both are purely additive and only read by the new UI code), no reverse-migration data concerns.

## Open Questions

None - the two scoping questions (store vs. resolve-live, and how to reconcile with the existing "no cover_id column" rule) are resolved above as explicit, documented decisions rather than left open.
