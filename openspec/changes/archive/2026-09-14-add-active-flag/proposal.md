## Why

The canonical King works and adaptations lists are curated manually, and entries occasionally need to be retired (a title added in error, a duplicate, a delisted adaptation) without deleting the row outright — deleting would break any `user_books`/`user_adaptations` history and foreign-key links already recorded against it. An `active` flag lets a curator take an entry out of circulation everywhere it's surfaced while keeping the underlying row and any user history intact.

## What Changes

- Add an `active` boolean column (default `true`) to `king_works` and to `adaptations`.
- Every read path that lists, counts, or links to King works or adaptations for display SHALL exclude inactive rows: works/adaptations browsing lists, work/adaptation detail pages (including cross-links like "based on" and "connected adaptations"), global search, homepage catalog totals/stats/leaderboards/spotlights/recommendations, and profile-showcase's reading-progress totals, Currently Reading, Bookshelf, and recommendation cards. Read List and Watch List likewise exclude inactive works/adaptations, even if a user has an existing want-to-read/want-to-watch or read/watched record against one.
- A detail page for an inactive work or adaptation SHALL resolve as not-found, the same as an unknown slug.
- `active` is set only through the same curated, seed-file-driven process as the rest of the canonical data (per `king-works`/`adaptations`' existing "no client-side writes" rule) — no in-app UI is added to toggle it.
- Existing `user_books`/`user_adaptations` rows referencing a work/adaptation that becomes inactive are left in storage untouched; they simply stop contributing to anything rendered, per the exclusions above.

Out of scope: short stories and short-story collections (the request covers only works and adaptations), and the not-yet-archived `profile-compare` capability.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `king-works`: adds the `active` field to canonical storage, and the standard list/single-fetch read paths exclude inactive works.
- `adaptations`: adds the `active` field to canonical storage, and the standard list/single-fetch read paths exclude inactive adaptations.
- `works-browsing`: the works list excludes inactive King works.
- `work-details`: an inactive work's detail page resolves as not-found, and other works' "connected adaptations" lists exclude inactive adaptations.
- `adaptations-browsing`: the adaptations list excludes inactive adaptations.
- `adaptation-details`: an inactive adaptation's detail page resolves as not-found, and other adaptations' "based on" lists exclude inactive King works.
- `global-search`: search results exclude inactive King works and inactive adaptations.
- `homepage`: catalog totals, the stats card, leaderboards, spotlights, Book of the week, Book birthday, and personalized recommendations all exclude inactive King works and adaptations.
- `profile-showcase`: reading-progress and viewing-progress totals, Currently Reading, Bookshelf, and recommendation cards exclude inactive King works and adaptations.
- `read-list`: the Read List excludes inactive King works, even ones already marked want-to-read.
- `watch-list`: the Watch List excludes inactive adaptations, even ones already marked want-to-watch.

## Impact

- Supabase migration adding `active boolean not null default true` to `king_works` and `adaptations`, pushed to hosted before merge (per this project's release process).
- `composables/useBooks.ts` and `composables/useAdaptations.ts` (and any other query helpers touching these tables): add `.eq('active', true)` (or equivalent) to every display-facing read, including joins/aggregates used for stats and leaderboards.
- Detail page loaders for works and adaptations: treat an inactive match the same as no match (404).
- Seed data (`supabase/seed/*.json`) gains the `active` field (defaulting to `true`) for existing rows.
