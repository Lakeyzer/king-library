# Stephen King Library

## What this is
A personal library app for Stephen King's works. Users can:
- Add books to a collection / wishlist / read list, and mark books read
- View statistics on most-read books (derived from user read data)
- Track a TV/movie adaptations section: watched + watchlist
- Browse a dedicated Dark Tower section

## Stack
- **Frontend**: Vue 3 + Nuxt (Nuxt 3/4), Nuxt UI for components, PWA support via `@vite-pwa/nuxt`
- **Backend/DB**: Supabase (Postgres, Auth, Row Level Security)
- **Book data**: [Open Library API](https://openlibrary.org/developers/api) — source of truth for book metadata and editions
- **Adaptation data**: TBD — IMDb has no public API; TMDb is the leading candidate (not yet confirmed)
- **Deploy**: Vercel, auto-deploy on push to `main` via GitHub integration — no manual deploy steps, no deploy scripts needed

## Data model notes
- **Canonical King bibliography**: a curated list of "official" Stephen King works (sourced manually from the official Stephen King website), stored in our own DB — this is the source of truth for "what counts as a King book," not something derived automatically from Open Library
- **Book editions**: when a user adds a book to their collection, they pick a specific *edition* — editions are fetched live from Open Library (not stored wholesale in our DB; cache/store only what a user has actually selected)
- **Adaptations**: separate domain from books — needs its own canonical list + external data source once chosen

## Project structure
- `app/` or `pages/` — Nuxt routes (confirm actual convention once repo is scaffolded)
- `components/` — Nuxt UI-based components
- `server/` — Nuxt server routes / API handlers (if used instead of calling Supabase directly from client)
- `composables/` — shared reactive logic (e.g. `useBooks`, `useAdaptations`)
- `supabase/` — migrations, schema, seed data (if using Supabase CLI locally)

## Core conventions (always apply)
- TypeScript everywhere — no plain `.js` files
- Use Nuxt UI components before building custom ones
- All Supabase queries go through composables — no direct `supabase.from(...)` calls inside `.vue` files
- Row Level Security is mandatory on every table containing user data — never disable RLS to "make it work"
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, etc.) since Vercel deploy is tied to `main`

## Where to look for more detail
- Supabase schema & query conventions → skill: `supabase-conventions`
- Nuxt/Vue component & styling conventions → skill: `nuxt-conventions`
- Open Library API usage (search, editions, rate limits, caching) → skill: `openlibrary-integration`
- Git/PR workflow before merging to `main` → skill: `git-workflow`
- Code review checklist → skill: `code-review`

## Non-goals (for now)
- No native mobile app — instead, ship the web app as a PWA (installable only — manifest + install prompt via `@vite-pwa/nuxt`; no offline data access, no service-worker caching of Supabase data)
- No self-hosted deploy pipeline — Vercel handles this entirely
