# Stephen King Library

## What this is

A personal library app for Stephen King's works. Users can:

- Add books to a collection / wishlist / read list, and mark books read
- View statistics on most-read books (derived from user read data)
- Track a TV/movie adaptations section: watched + watchlist
- Browse a dedicated Dark Tower section

## Stack

- **Package Manager** pnpm
- **Frontend**: Vue 3 + Nuxt (Nuxt 3/4), Nuxt UI for components, PWA support via `@vite-pwa/nuxt`
- **Backend/DB**: Supabase (Postgres, Auth, Row Level Security)
- **Book data**: [Open Library API](https://openlibrary.org/developers/api) — source of truth for book metadata and editions
- **Adaptation data**: TBD — IMDb has no public API; TMDb is the leading candidate (not yet confirmed)
- **Deploy**: Vercel, auto-deploy on push to `main` via GitHub integration — no manual deploy steps, no deploy scripts needed. Schema changes must be pushed to hosted Supabase _before_ merging to `main`, not after — see "Release process" below.

## Data model notes

- **Canonical King bibliography**: a curated list of "official" Stephen King works (sourced manually from the official Stephen King website), stored in our own DB — this is the source of truth for "what counts as a King book," not something derived automatically from Open Library
- **Book editions**: when a user adds a book to their collection, they pick a specific _edition_ — editions are fetched live from Open Library (not stored wholesale in our DB; cache/store only what a user has actually selected)
- **Adaptations**: separate domain from books — needs its own canonical list + external data source once chosen

## Project structure

- `app/` or `pages/` — Nuxt routes (confirm actual convention once repo is scaffolded)
- `app/layouts/` — Nuxt layouts; only `default` exists for now (header, footer, and a contained page area that pages opt into)
- `components/` — Nuxt UI-based components
- `server/` — Nuxt server routes / API handlers (if used instead of calling Supabase directly from client)
- `composables/` — shared reactive logic (e.g. `useBooks`, `useAdaptations`)
- `supabase/` — migrations, schema, seed data (if using Supabase CLI locally)

## Testing workflow

When a feature is finished, stop and report what's ready for manual testing — don't start the Nuxt dev server (or any other dev/preview server) as part of wrapping up. Testing is done by hand, run on demand, not launched automatically at the end of a task.

## Release process

Versioning follows `major.minor.hotfix` (e.g. `0.0.1`), tracked in `package.json`'s `version` field. "Hotfix" plays the role semver usually calls "patch" — small fixes, no new features; the bump rules are otherwise standard semver. To release, just say so directly: "release as hotfix" / "release as minor" / "release as major".

- **hotfix** — bump the third number: `0.1.3` → `0.1.4`
- **minor** — bump the second number, reset hotfix to 0: `0.1.4` → `0.2.0`
- **major** — bump the first number, reset minor and hotfix to 0: `0.2.0` → `1.0.0`

When a release is requested, the sequence is:

1. **If the branch includes Supabase migrations and/or seed data changes not yet applied to hosted, push those first.** Follow `supabase-conventions`'s local-development workflow — this still requires an explicit go-ahead before writing to hosted, a release request isn't a standing approval for that. Most releases won't touch seed data at all (it only changes when the bibliography or adaptations list actually changes), so this is conditional — check whether `supabase/seed/*.json` changed on the branch before assuming a hosted reseed is needed. The hosted schema/data needs to be live _before_ the code that depends on it ships, since Vercel deploys immediately on merge with no gap in between to catch up.
2. **Bump the version** in `package.json` to match the requested release type, and commit that bump on its own (not bundled into a feature commit).
3. **Merge the branch into `main`** — this is what triggers Vercel's auto-deploy; no manual deploy step exists or is needed.
4. **Tag the merge commit** `vX.Y.Z` and push the tag.

If a future `git-workflow` skill is added, branch-naming and PR conventions belong there — but the version-bump → push-schema → merge sequence stays here, since it's the core release contract for this project, not a git-mechanics detail.

## Core conventions (always apply)

- TypeScript everywhere — no plain `.js` files
- Use Nuxt UI components before building custom ones
- All Supabase queries go through composables — no direct `supabase.from(...)` calls inside `.vue` files
- Row Level Security is mandatory on every table containing user data — never disable RLS to "make it work"

## Where to look for more detail

- Supabase schema & query conventions → skill: `supabase-conventions`
- Nuxt/Vue component & styling conventions → skill: `nuxt-conventions`
- Open Library API usage (search, editions, rate limits, caching) → skill: `openlibrary-integration`
- Git/PR workflow before merging to `main` → skill: `git-workflow`
- Code review checklist → skill: `code-review`

## Non-goals (for now)

- No native mobile app — instead, ship the web app as a PWA (installable only — manifest + install prompt via `@vite-pwa/nuxt`; no offline data access, no service-worker caching of Supabase data)
- No self-hosted deploy pipeline — Vercel handles this entirely
