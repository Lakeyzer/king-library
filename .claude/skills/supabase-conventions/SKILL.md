---
name: supabase-conventions
description: Database schema, RLS policies, and query conventions for the Stephen King Library app's Supabase backend. Use this whenever writing or modifying anything that touches the database — Supabase queries, composables, migrations, RLS policies, seed files, or the tables king_works, adaptations, adaptation_works, adaptation_short_stories, king_short_stories, king_short_story_collections, profiles, user_books, user_book_editions, user_adaptations, or user_short_story_reads. Also use when adding any feature that reads or writes user collections, wishlists, read status, watch status, short story reads, cover images, or statistics/leaderboards, since these all depend on this schema. Consult this skill before writing a single `supabase.from(...)` call anywhere in the app.
---

# Supabase Conventions — Stephen King Library

This skill is the source of truth for the database schema and how to interact with it. Do not invent tables, columns, or RLS policies that aren't described here — if a feature needs something not covered, stop and ask rather than improvising a schema change.

## Core rule: queries only via composables

No `.vue` file ever calls `supabase.from(...)` directly. Every table gets a composable (e.g. `useBooks`, `useAdaptations`, `useProfile`) that wraps reads/writes for that table. This keeps RLS-dependent query logic (see below) in one place instead of scattered across components.

## Local development & deployment workflow

Any task that touches migrations, RLS policies, triggers, or seed data follows this sequence — the hosted Supabase project is never the first place a schema change is tried:

1. **Develop and test against a local Supabase instance in Docker** (`supabase start`), not directly against the hosted project. Write migrations, apply them locally, load seed data locally, and verify the feature works there first.
2. **Treat the local Supabase instance as persistent, not disposable.** Stopping it between sessions is fine (`supabase stop`, which preserves the Docker volume) — tearing it down in a way that discards that volume is not. The local instance should never need to be rebuilt from scratch as a routine step; `supabase start` should resume the existing state, migrations and seed data already applied.
3. **Keep local in sync with hosted, or ahead of it — never behind.** Before starting new schema work, confirm local has every migration hosted has (`supabase migration list` shows both sides) — hosted should only ever move ahead of local via a push that originated from local in the first place, so drift shouldn't happen in normal use, but check rather than assume if something seems off. While a feature is in progress, it's expected and fine for local to be ahead of hosted (new migrations applied locally, not yet pushed) — that gap is exactly what "test locally before touching hosted" means.
4. **Prefer `supabase migration up` over `supabase db reset` for applying a new migration locally.** `migration up` applies only the pending migration(s) against the existing local database, leaving every other table's rows — including `auth.users`, `profiles`, and every `user_*` table — untouched. `supabase db reset` wipes the *entire* local database (every table, every schema, not just the one being changed) and reapplies all migrations plus `supabase/seed.sql` from scratch; it does **not** rerun the `seed:*` scripts in `package.json`, so a `king_works`/bibliography reseed still needs a manual `pnpm run seed:*` afterward. A `db reset` also silently deletes the local session of whoever is signed in (their `auth.users` row disappears, so their existing browser session becomes a token for a user that no longer exists, and a `.single()` profile lookup then throws "Cannot coerce the result to a single JSON object" until they sign in again) and deletes their local `user_books`/read-tracking test data. Only reach for `db reset` when local state is actually suspect and a from-scratch rebuild is the goal — **never as a convenience for applying one migration**, and always say so explicitly before running it, since it discards the current user's local session and data.
   - If a new `not null` column can't be added to an already-populated table without a default (the common case for a seed-file-driven table like `king_works`), don't reach for `db reset` to sidestep that — split it into two migrations instead: one that adds the column nullable, a `pnpm run seed:*` to backfill it via the existing upsert, then a second migration that sets `not null` (and drops the old column, if any). This keeps the change to one migration-only table, with zero blast radius on `auth.users`/`profiles`/`user_*` tables.
5. **Local dev and the deployed app point at permanently separate Supabase targets — nothing gets switched.** `.env` (or `.env.local`, gitignored) holds local Supabase's URL and anon key from `supabase status`, and never changes — running `pnpm dev` always talks to local Supabase. The deployed app never reads that file at all; it gets hosted's URL and anon key from Vercel's own environment variables, configured once in the Vercel dashboard, not something this workflow touches. Because the two are already separate, "ask the person to test" just means asking them to run `pnpm dev` — no config change needed first, and none needed to revert afterward.
6. **Never write to the hosted/linked project without asking first.** Once the person confirms local testing looks good and gives an explicit go-ahead, push the migrations (and re-seed if needed) to hosted — this should happen _before_ merging the feature branch to main, since Vercel auto-deploys on merge and the deployed code shouldn't go live expecting a schema hosted doesn't have yet. Treat the go-ahead as a distinct, explicit checkpoint, not something implied by an earlier "looks good" in the conversation — local Docker is the sandbox for iterating freely, but the hosted project holds real data other features may already depend on.
7. **`supabase db reset` is a local-only command — never run it, in any form, against the hosted/linked project.** This project's local CLI is linked to the hosted "King Library" project (`supabase status` shows `linked_project`), so `--linked` (or any `--db-url` pointing at hosted) is available on several commands — but there is no legitimate reason to ever pass it to `db reset`: hosted holds real user data, and a full reset there is unrecoverable data loss, not a "sync" operation. The only sanctioned way to change hosted's schema is an additive `supabase db push` (see 6 above), and the only sanctioned way to change hosted's seed-file-driven table contents is the `seed:*:hosted` / `backfill:*` scripts — both already require the explicit go-ahead in 6. If a task ever seems to call for resetting or wiping hosted, that's a sign to stop and ask, not a variant of a local command to run with a different flag.

## Schema

All `date` columns (e.g. `publish_date`, `started_on`, `finished_on`) must use ISO 8601 format: `YYYY-MM-DD`. This applies to values in seed files, migration defaults, and any date the client sends to the database. Never use locale-specific formats, slashes, or two-digit years.

### `king_works` (seed-file-driven, read-only at runtime)

| column                  | type                     | notes                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                    | uuid, PK                 |                                                                                                                                                                                                                                                                                |
| `title`                 | text                     |                                                                                                                                                                                                                                                                                |
| `type`                  | text                     | `novel` / `short_story` / `collection` / etc.                                                                                                                                                                                                                                  |
| `publish_date`          | date                     |                                                                                                                                                                                                                                                                                |
| `slug`                  | text, unique             | kebab-case version of `title`, used for URL routing (e.g. `the-stand` → `/works/the-stand`). Apostrophes are stripped; other non-alphanumeric characters become hyphens. Set in the seed file — never computed at runtime.                                                     |
| `open_library_work_key` | text, nullable           | for matching against Open Library search                                                                                                                                                                                                                                       |
| `cover_id`              | integer, nullable        | Open Library numeric cover id, used to build `https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg` for the works-browsing table thumbnail. See "Cover images" below — this is a narrow, explicit exception to the "don't store a cover id" rule, not a general precedent |
| `dark_tower`            | boolean, default `false` | `true` only for works that are part of the core Dark Tower series — not for works merely connected to it (see `dark_tower_relation`)                                                                                                                                           |
| `bachman`               | boolean, default `false` | `true` for works published under the Richard Bachman pseudonym                                                                                                                                                                                                                 |
| `dark_tower_relation`   | text, nullable           | free-text note on how the work connects to the Dark Tower series (for series-proper works and for outside works sharing characters/settings/events with it); `null` means no connection worth noting                                                                           |

Maintained in `supabase/seed/king_works.json` (or `.sql`), checked into the repo. Adding a new King book = editing the seed file + redeploying the seed — **never** a runtime insert/update from the app, and there is no UI for editing this table.

### `adaptations` (seed-file-driven, read-only at runtime)

| column             | type                     | notes                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | uuid, PK                 |                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `title`            | text                     |                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `type`             | text                     | `movie` / `series` / `miniseries` / `tv_movie`                                                                                                                                                                                                                                                                                                                                                                                         |
| `release_year`     | int                      |                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `slug`             | text, unique             | kebab-case version of `title`, used for URL routing (e.g. `misery` → `/adaptations/misery`). When multiple adaptations share a title, the release year is appended to all entries in that group (e.g. `carrie-1976`, `carrie-2013`, `the-shining-1980`). Set in the seed file. |
| `tmdb_id`          | int, nullable            | numeric TMDb id, for matching against TMDb                                                                                                                                                                                                                                                                                                                                                                                             |
| `tmdb_media_type`  | text, nullable           | `movie` or `tv` — TMDb keeps separate ID namespaces for movies and TV shows, so `tmdb_id` alone is ambiguous for building an API call or a link; this says which endpoint it belongs to                                                                                                                                                                                                                                                |
| `tmdb_poster_path` | text, nullable           | TMDb's own poster path (e.g. `/abc123.jpg`), used to build `https://image.tmdb.org/t/p/{size}{tmdb_poster_path}` for the adaptations-browsing table thumbnail. Same narrow exception as `king_works.cover_id` — see "Cover images" below                                                                                                                                                                                               |
| `is_universe_only` | boolean, default `false` | `true` for adaptations that draw on King's characters, settings, or "universe" without adapting a specific plot — e.g. Castle Rock, Kingdom Hospital, Golden Years, The Diary of Ellen Rimbauer. These rows have **no** entries in `adaptation_works` or `adaptation_short_stories` (see below); the flag is what a UI checks before showing an empty "based on" section as "loosely set in King's universe" rather than as a data gap |
| `notes`            | text, nullable           | free-text context for loose, composite, or non-obvious adaptations — which specific stories an anthology episode draws from, why something is marked `is_universe_only`, etc. `null` when the adaptation is a straightforward single-source case that doesn't need explaining                                                                                                                                                          |

Same maintenance pattern as `king_works`: seed file in the repo (`supabase/seed/adaptations.json`), redeployed on change, no runtime CRUD. Its relationship to source material is handled entirely by `adaptation_works` and `adaptation_short_stories` below, not by a column on this table.

### `adaptation_works` (seed-file-driven, read-only at runtime — links adaptations to works)

A proper many-to-many join, not a single FK column on `adaptations`, because some adaptations draw on more than one work (King's universe is heavily cross-referential — a nullable single `king_work_id` would force picking one "primary" source and lose the rest).

| column          | type                        | notes |
| --------------- | --------------------------- | ----- |
| `id`            | uuid, PK                    |       |
| `adaptation_id` | uuid, FK → `adaptations.id` |       |
| `king_work_id`  | uuid, FK → `king_works.id`  |       |

Unique constraint on `(adaptation_id, king_work_id)`. Same seed-file maintenance pattern as `king_works`/`adaptations` — this is curated bibliography data, not user data, so it's maintained in `supabase/seed/adaptation_works.json` and redeployed on change, never written at runtime.

### `adaptation_short_stories` (seed-file-driven, read-only at runtime — links adaptations to short stories)

The same join, one table over, for adaptations sourced from an individual short story or novella rather than a full book/collection. This is a distinct, common case — The Shawshank Redemption (from the novella "Rita Hayworth and Shawshank Redemption"), Stand By Me (from "The Body"), Creepshow (from five separate Night Shift/Skeleton Crew/uncollected stories) — and matters for stats: without it, an adaptation like Shawshank would appear to have no source in `adaptation_works` at all, since its source was never a `king_works` row to begin with.

| column           | type                               | notes |
| ---------------- | ---------------------------------- | ----- |
| `id`             | uuid, PK                           |       |
| `adaptation_id`  | uuid, FK → `adaptations.id`        |       |
| `short_story_id` | uuid, FK → `king_short_stories.id` |       |

Unique constraint on `(adaptation_id, short_story_id)`. Same seed-file maintenance pattern — `supabase/seed/adaptation_short_stories.json`, no runtime CRUD.

**Collection implication:** a short story always belongs to one or more collections via `king_short_story_collections`. An adaptation of a short story is therefore implicitly related to every collection that contains it — this relationship is **not** duplicated as an explicit row in `adaptation_works` (that would create redundant, potentially drifting data). Instead it is derived at query time by joining through `king_short_story_collections` (see "Collection-level adaptation lookup" below). A collection's detail page must traverse this join to surface all adaptations whose source stories appear in it.

Kept as its own table rather than folding into `adaptation_works` with a nullable `short_story_id` alongside a nullable `king_work_id`, or a polymorphic `source_type`/`source_id` pair on one shared table — this schema already prefers explicit typed FKs over polymorphic associations elsewhere (see `king_short_story_collections`), and a single join table with two nullable target columns would let a row reference neither or both, which is exactly the kind of state a schema shouldn't be able to represent in the first place.

An adaptation can have rows in `adaptation_works`, `adaptation_short_stories`, both (uncommon, but not disallowed — nothing stops an adaptation from citing both a full work and a specific short story as sources), or neither (`is_universe_only = true` on `adaptations`, see above).

A work's or short story's detail page queries the matching table filtered by `king_work_id`/`short_story_id` to list its adaptations. An adaptation's detail page queries **both** `adaptation_works` and `adaptation_short_stories` filtered by `adaptation_id` and combines the results to build its full "based on" list.

### Collection-level adaptation lookup

A `king_work` of `type = 'collection'` can be related to adaptations in two distinct ways — both must be queried to show the full picture:

1. **Direct**: `adaptation_works` rows where `king_work_id` matches the collection (e.g. Creepshow, which draws on several Night Shift / Skeleton Crew stories and is explicitly linked to both collections as a whole).
2. **Via short stories**: `adaptation_short_stories` rows for stories that belong to the collection, reached through `king_short_story_collections`.

**Do not add explicit `adaptation_works` rows to represent the collection link** when the adaptation is already in `adaptation_short_stories` — that would duplicate the relationship and require keeping two rows in sync whenever a story's collection membership changes.

Instead, derive the collection relationship at query time. The pattern, used both in composables and in the `adaptation_vs_source_stats` view family:

```sql
-- All adaptations touching a given collection (direct + via its short stories)
select aw.adaptation_id, 'direct' as link_type
from adaptation_works aw
where aw.king_work_id = $collection_id

union

select ass.adaptation_id, 'via_short_story' as link_type
from adaptation_short_stories ass
join king_short_story_collections ksc on ksc.short_story_id = ass.short_story_id
where ksc.king_work_id = $collection_id;
```

The `link_type` tag is optional but useful for display: a "direct" link might show as "Adaptation of this collection"; a "via_short_story" link might show as "Adaptation of a story in this collection" (with the specific short story title resolved from `king_short_stories`).

Similarly, an adaptation's own detail page should show the collection context for its short-story sources — not just the story title, but also "appears in: Night Shift". `useAdaptations()` resolves this by joining `adaptation_short_stories` → `king_short_story_collections` → `king_works` for any short-story source, and including the collection title alongside the story title in the "based on" list.

### `king_short_stories` (seed-file-driven, read-only at runtime)

Short stories are **not** rows in `king_works` — that table represents things a user independently collects (owns/wishlists/reads as a standalone unit), and a short story only exists _inside_ a collection, never acquired on its own. Mixing them in would break the "1 row = 1 shelf-able thing" semantics `user_books` is built around.

| column                  | type                     | notes                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                    | uuid, PK                 |                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `title`                 | text                     |                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `type`                  | text                     | `short_story` or `novella` — distinguishes shorter pieces from novella-length ones (e.g. "The Boogeyman" vs. "The Body"). Looser than `king_works.type`: everything in this table is, by definition, a piece that only exists inside a collection rather than being independently shelved, so this column exists purely for display/filtering, not to gate any behavior the way `king_works.type = 'collection'` does elsewhere |
| `original_publish_year` | int, nullable            |                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `first_published_in`    | text, nullable           | magazine/anthology if it debuted outside a King collection                                                                                                                                                                                                                                                                                                                                                                      |
| `dark_tower`            | boolean, default `false` | same meaning as `king_works.dark_tower` — counts toward Dark Tower completion tracking (see "Reading progress by category" below)                                                                                                                                                                                                                                                                                               |
| `dark_tower_relation`   | text, nullable           | same meaning as `king_works.dark_tower_relation`                                                                                                                                                                                                                                                                                                                                                                                |

**No `bachman` column here** — Richard Bachman was a pseudonym used for novels only; no short story was ever published under it. Adding a column that can never meaningfully be `true` would just be clutter. Revisit only if that historical fact turns out to be wrong.

Same seed-file maintenance pattern as `king_works` — `supabase/seed/king_short_stories.json`, no runtime CRUD.

### `king_short_story_collections` (seed-file-driven, links short stories to the collections containing them)

Many-to-many, not a single FK on `king_short_stories`, because stories get reprinted across multiple collections over the years (e.g. a story could appear in its original collection and later in a "best of" anthology).

| column                | type                               | notes                                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                  | uuid, PK                           |                                                                                                                                                                                                                                                                                      |
| `short_story_id`      | uuid, FK → `king_short_stories.id` |                                                                                                                                                                                                                                                                                      |
| `king_work_id`        | uuid, FK → `king_works.id`         | expected to reference a row where `type = 'collection'` — this is a seed-file authoring convention, not a DB-enforced constraint (Postgres can't easily check a value against another table's column without a trigger, and it's not worth one for curated, developer-authored data) |
| `order_in_collection` | int, nullable                      |                                                                                                                                                                                                                                                                                      |

Unique constraint on `(short_story_id, king_work_id)`. Same seed-file maintenance pattern, no runtime CRUD. A story's detail page shows "appears in: X, Y" by querying this filtered on `short_story_id`.

### `user_short_story_reads` (read-tracking for individual short stories)

Unlike `user_books`, a short story has exactly one meaningful state — read or not — so this is a **row-existence table**, not a boolean-flags row: a row existing _is_ "has read this story." No `wishlisted`/`want_to_read` equivalent, since wanting to read a story is already covered by wanting to read the collection it's in.

| column           | type                               | notes |
| ---------------- | ---------------------------------- | ----- |
| `id`             | uuid, PK                           |       |
| `user_id`        | uuid, FK → `auth.users.id`         |       |
| `short_story_id` | uuid, FK → `king_short_stories.id` |       |
| `read_at`        | timestamptz, default `now()`       |       |

Unique constraint on `(user_id, short_story_id)`. Same reread limitation as `user_books`/`user_adaptations`: `read_at` holds only the most recent value, no history — see the note under `user_books` above.

### `profiles` (public directory of users)

| column       | type                           | notes                                                                                                                                                              |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | uuid, PK, FK → `auth.users.id` |                                                                                                                                                                    |
| `username`   | text, unique, nullable         | `null` until the user completes onboarding — enforced format via a `check` constraint (3–24 lowercase letters/digits/underscore), see `user-onboarding` capability |
| `avatar_url` | text, nullable                 |                                                                                                                                                                    |
| `is_public`  | boolean, default `true`        | gates visibility of this user's **collections** (see RLS below) — the profile row itself (username) is always readable                                             |
| `created_at` | timestamptz, default `now()`   |                                                                                                                                                                    |

`auth.users` is never exposed to the client directly (it holds emails, password hashes, etc.), which is exactly why `profiles` exists — it's the public-safe mirror. A row is created automatically via a trigger on `auth.users` insert (`handle_new_user()` function, `SECURITY DEFINER`) — never insert into `profiles` from client code.

Implemented in `supabase/migrations/20260903120000_create_profiles_table.sql`.

### `user_books` (join table: user ↔ king_work — the single source of truth for the relationship)

One row per `(user_id, king_work_id)`. This is the authoritative record of whether a work is owned, wishlisted, and/or read — **ownership does not require an edition to be selected.** Editions (below) are optional supplementary detail a collector may attach on top of this.

| column              | type                       | notes                                                                                                                                                                                                                     |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | uuid, PK                   |                                                                                                                                                                                                                           |
| `user_id`           | uuid, FK → `auth.users.id` |                                                                                                                                                                                                                           |
| `king_work_id`      | uuid, FK → `king_works.id` |                                                                                                                                                                                                                           |
| `owned`             | boolean, default `false`   | generic "I own this work" — true whether or not any edition has been picked                                                                                                                                               |
| `wishlisted`        | boolean, default `false`   | wants to _own_ it (see Triggers: cleared when `owned` becomes true)                                                                                                                                                       |
| `want_to_read`      | boolean, default `false`   | wants to _read_ it — a separate intent from wanting to own; see Triggers                                                                                                                                                  |
| `currently_reading` | boolean, default `false`   | supports being mid-read on several works at once — this is a per-row flag, so "reading 3 books" is just 3 rows each with this `true`, no special handling needed                                                          |
| `started_on`        | date, nullable             | the date the user started reading — **`date`, not `timestamptz`**: this is a calendar date the user picks (e.g. via a native date input), not a moment in time, so there's no time-of-day or timezone to store or convert |
| `read`              | boolean, default `false`   |                                                                                                                                                                                                                           |
| `finished_on`       | date, nullable             | the date the user finished reading — same `date`-not-`timestamptz` reasoning as `started_on`                                                                                                                              |
| `read_year`         | int, nullable              | approximate fallback for when a user wants to log a book as read with only a rough year, not an exact date — independent of `started_on`/`finished_on`, not derived from them; see below                                  |

These are independent booleans, not an enum — a work can be `owned` _and_ `read` _and_ have previously been `wishlisted`; forcing a single `status` would lose that. Unique constraint on `(user_id, king_work_id)` — this is the one row per user per work.

**Invariants**, all enforced with database triggers, not client-side logic — see "Triggers" below:

- A work is never simultaneously `owned` and `wishlisted`.
- Marking `read = true` clears both `want_to_read` and `currently_reading`.
- Marking `currently_reading = true` clears `want_to_read` (you've moved past "want to" into "doing it").

Wishlisting/want-to-read are work-level only (no edition selection) — this app isn't trying to support "wishlist a specific first edition."

### Reading dates: three entry points, three different prompts

`started_on`, `finished_on`, and `read_year` are populated by three distinct UI flows, and the composable needs to handle each differently rather than treating "set a date" as one generic action:

1. **Starting a read** (`currently_reading` flips to `true`): a modal prompts for a start date, prefilled with today (the user's local today, computed client-side — never server "now," which could be a different calendar day depending on timezone). The date is expected to always be provided here — the modal defaults it rather than allowing a true skip, since starting-to-read is the one moment a date is naturally at hand.
2. **Finishing a currently-reading book** (a "Finished" action on a book that's `currently_reading`): a modal prompts for an end date, same prefill behavior, and sets `read = true`, `finished_on = <chosen date>`. `started_on` is left untouched — it already holds the date set in step 1.
3. **Marking read directly**, bypassing `currently_reading` entirely: a modal offers a full date range (`started_on` + `finished_on`) **or** just `read_year`, and either or both can be skipped entirely. All three of `started_on`, `finished_on`, and `read_year` stay `nullable` at the DB level specifically to support this — a `read = true` row with all three `null` is valid and expected, not a data-quality problem to flag.

No DB constraint ties `read_year` to `finished_on` (e.g. requiring them to agree, or deriving one from the other) — a user might reasonably supply a year without a precise date, or a precise date without bothering to fill in a redundant year. When both are present and a display needs a single "year read," compute it at query time as `coalesce(extract(year from finished_on), read_year)` rather than trying to keep the two in sync at write time.

**Known limitation, deliberately accepted for now:** `started_on`/`finished_on`/`read_year` each hold only the most recent reading cycle's values — rereading a work overwrites them rather than preserving history. This means a reading-journey timeline built from `user_books` shows each work's _most recent_ read only, not every past reread. If reread history becomes a real feature later (a "read 3 times" stat, a full reread log, a timeline that shows every cycle), that's a new table (e.g. `read_events`, one row per read cycle) layered on top, not a change to these columns — don't retrofit history into single-value fields.

### Building a reading timeline

No new view needed — a timeline is a plain query against `user_books`, ordered by whichever date is most relevant to display, filtered to rows that actually have one:

```sql
select king_work_id, started_on, finished_on, read_year
from user_books
where user_id = $1
  and (started_on is not null or finished_on is not null or read_year is not null)
order by coalesce(finished_on, started_on) desc nulls last, read_year desc nulls last;
```

Rows with only `read_year` (no exact dates) sort after everything with a real date in this ordering — reasonable for "recent activity first," but worth revisiting once you're actually building the timeline UI, since a `read_year`-only entry from this year probably belongs above an exact date from three years ago and a pure `coalesce`/`nulls last` sort won't get that right on its own.

### `user_book_editions` (optional detail: specific copies of an owned work)

Zero or more rows per `(user_id, king_work_id)`, only created when a user chooses to record a specific edition. **This table never determines ownership on its own** — "does the user own this work" is always answered by `user_books.owned`, never by checking for rows here. A non-collector can own a work with zero rows in this table; a collector can have several.

| column          | type                         | notes                                                                                                          |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`            | uuid, PK                     |                                                                                                                |
| `user_id`       | uuid, FK → `auth.users.id`   |                                                                                                                |
| `king_work_id`  | uuid, FK → `king_works.id`   |                                                                                                                |
| `edition_id`    | text                         | Open Library edition key (e.g. `OL7353617M`) — required, since every row is a specific edition the user picked |
| `edition_title` | text                         | denormalized title snapshot, paired with `edition_id`                                                          |
| `added_at`      | timestamptz, default `now()` |                                                                                                                |

- Unique constraint on `(user_id, edition_id)` — stops the exact same edition being added twice. No constraint on `(user_id, king_work_id)` — multiple editions of the same work are expected.
- **Adding an edition row must also upsert `user_books.owned = true`** for that `(user_id, king_work_id)` — two writes, both the composable's responsibility (see "Conventions for composables" below). Never assume an edition row implies ownership without also setting the flag; the flag is what everything else (RLS-gated reads, the ownership stat, the owned/wishlisted trigger) reads from and reacts to.
- **Removing the last edition row does _not_ auto-flip `owned` back to `false`.** A user may still generically own the work without a tracked copy. If a user explicitly un-owns a work via the UI, that's a separate, deliberate action — cascading it to delete edition rows too is a UI courtesy, not a DB rule.
- **No cover image column.** Cover art is never stored — see "Cover images" below.

### `user_adaptations` (join table: user ↔ adaptation)

Same boolean-flag pattern as `user_books`, minus ownership — adaptations don't have an editions/ownership concept, just watch intent and completion.

| column          | type                        | notes |
| --------------- | --------------------------- | ----- |
| `id`            | uuid, PK                    |       |
| `user_id`       | uuid, FK → `auth.users.id`  |       |
| `adaptation_id` | uuid, FK → `adaptations.id` |       |
| `want_to_watch` | boolean, default `false`    |       |
| `watched`       | boolean, default `false`    |       |
| `watched_at`    | timestamptz, nullable       |       |

Unique constraint on `(user_id, adaptation_id)` — one row per user per adaptation. **Invariant, enforced with a trigger (see "Triggers"):** marking `watched = true` clears `want_to_watch`. No "currently watching" state — that's an intentional simplification for now; if multi-episode TV series later warrant tracking watch-in-progress the way `currently_reading` does for books, that's a new column and trigger update, not a repurposing of these two.

**No standalone `editions` table.** Open Library is the source of truth for edition data (cover, ISBN, publisher, etc.) and is queried live via `openlibrary-integration`. We only ever persist a reference (id + title) once a user actually adds an edition to their collection — never a full cached copy, and never speculative caching of editions a user hasn't chosen.

## Cover images

**Store the Open Library edition/cover identifier only. Never copy cover art into Supabase Storage.**

- `user_book_editions.edition_id` is enough to build a cover URL on demand: `https://covers.openlibrary.org/b/olid/{edition_id}-{size}.jpg` (sizes `S`/`M`/`L`). This should be a single shared helper (e.g. `getEditionCoverUrl(editionId, size)`), not inlined string templates scattered across components.
- **Fallback for owned-without-edition:** a work can be `owned` with zero rows in `user_book_editions` (see above), so the bookshelf UI needs a cover even then. Use the _work's_ default cover instead of an edition's: fetch it live from Open Library's work record (`https://openlibrary.org/works/{open_library_work_key}.json`, which exposes a `covers` array of cover IDs), then build the image URL as `https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg`. This is a second helper, `getWorkCoverUrl(workKey, size)`, and a live fetch each time (or cached in memory for the session) — never persisted to the DB, same as edition covers.
- Cover resolution order for a bookshelf tile: if the work has edition row(s), render the edition cover(s) — that's the point of tracking a specific copy. If it's `owned` with no edition rows, render the work-level fallback cover instead.
- **Do not add a `cover_url` or `cover_id` column anywhere else** — it would duplicate what's derivable from `edition_id` / `open_library_work_key` and risks drifting if Open Library's URL scheme ever changes (fix the helper in one place instead).
- Do not download/store the actual image bytes in Supabase Storage. This would mean self-hosting copyrighted publisher artwork rather than linking to a source licensed to serve it, plus added storage cost and cache-invalidation complexity, for a project with no offline-data requirement (PWA is install-prompt-only).
- If Open Library image delivery ever proves unreliable in practice, the fix is a thin caching image-proxy edge function — not bulk-copying files into Storage. Not needed at this stage.

### The one sanctioned exception: canonical-bibliography listing thumbnails

`king_works.cover_id` and `adaptations.tmdb_poster_path` are the **only** persisted cover/poster columns in the schema, and they exist for a different problem than the one above: rendering a thumbnail per row on the `/works` and `/adaptations` browsing tables, where dozens of rows render at once. The live-fetch pattern above works because it resolves one work at a time (a single bookshelf tile); doing that per-row across a full table listing would mean dozens of live Open Library/TMDb calls per page view, with real rate-limit risk. So for these two tables only:

- `king_works.cover_id` (Open Library numeric cover id) and `adaptations.tmdb_poster_path` (TMDb's own poster path string) are populated ahead of time by one-off backfill scripts (`supabase/seed/backfill-cover-ids.ts`, `supabase/seed/backfill-tmdb-posters.ts`) that **write to the seed JSON files** (`king_works.json`, `adaptations_seed.json`), never directly to the database — same seed-file-is-source-of-truth pattern as the rest of these tables. Rerun the relevant `seed:*` script afterward to load the result.
- Build the display URL client-side with `getOpenLibraryCoverUrl(coverId, size)` / `getTmdbPosterUrl(posterPath, size)` (`app/utils/coverImages.ts`) — the same "compose from a stored identifier, never persist a full URL" principle as everywhere else in this section.
- This does **not** extend to `user_book_editions` or any other table — the rule above ("do not add a `cover_id` column anywhere else") still holds everywhere except these two named columns. If a future feature seems to need another persisted cover/poster column, treat that as a new decision to make explicitly, not as license to reuse this exception.

## Triggers

Like RLS, triggers exist to make an invariant hold no matter which code path writes to a table — a composable, a future admin tool, a script — rather than trusting every future write site to remember a rule. Two triggers exist in this schema:

**`handle_new_user()`** — `security definer` function on `auth.users` insert, auto-creates the matching `profiles` row. Never insert into `profiles` from client code (see "Schema" above).

**`clear_wishlist_on_owned()`** — on `user_books`, before insert/update, forces `wishlisted = false` whenever a row is written with `owned = true`. This is what keeps "owned" and "wishlisted" mutually exclusive without any composable needing to know about it.

```sql
create or replace function clear_wishlist_on_owned()
returns trigger
language plpgsql
as $$
begin
  if new.owned = true then
    new.wishlisted := false;
  end if;
  return new;
end;
$$;

create trigger user_books_clear_wishlist_on_owned
  before insert or update on user_books
  for each row
  execute function clear_wishlist_on_owned();
```

**`clear_read_states_on_progress()`** — on `user_books`, before insert/update, enforces the reading-progress invariants: finishing a work clears both `want_to_read` and `currently_reading`; starting a work clears `want_to_read`.

```sql
create or replace function clear_read_states_on_progress()
returns trigger
language plpgsql
as $$
begin
  if new.currently_reading = true then
    new.want_to_read := false;
  end if;
  if new.read = true then
    new.want_to_read := false;
    new.currently_reading := false;
  end if;
  return new;
end;
$$;

create trigger user_books_clear_read_states
  before insert or update on user_books
  for each row
  execute function clear_read_states_on_progress();
```

Both triggers run on the same table and touch disjoint columns, so order between them doesn't matter. Composables should never duplicate either of these by also clearing the flags manually in the same call — the triggers already guarantee it, and doing both invites the two definitions drifting apart later.

**`clear_want_to_watch_on_watched()`** — on `user_adaptations`, before insert/update, forces `want_to_watch = false` whenever a row is written with `watched = true`. Same pattern as the book triggers, one table over.

```sql
create or replace function clear_want_to_watch_on_watched()
returns trigger
language plpgsql
as $$
begin
  if new.watched = true then
    new.want_to_watch := false;
  end if;
  return new;
end;
$$;

create trigger user_adaptations_clear_want_to_watch
  before insert or update on user_adaptations
  for each row
  execute function clear_want_to_watch_on_watched();
```

**`cascade_short_story_reads_on_collection_read()`** — on `user_books`, after insert/update, when a row for a work of type `collection` is marked `read = true`, inserts a `user_short_story_reads` row for every short story linked to that collection via `king_short_story_collections`. This is an `after` trigger, not `before` — it writes to a _different_ table as a side effect rather than modifying the row being saved, so it can't use the same `before`/mutate-`new` shape as the other triggers.

```sql
create or replace function cascade_short_story_reads_on_collection_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'insert' or old.read is distinct from true) then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'collection') then
      insert into user_short_story_reads (user_id, short_story_id)
      select new.user_id, ksc.short_story_id
      from king_short_story_collections ksc
      where ksc.king_work_id = new.king_work_id
      on conflict (user_id, short_story_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger user_books_cascade_short_story_reads
  after insert or update on user_books
  for each row
  execute function cascade_short_story_reads_on_collection_read();
```

`on conflict do nothing` matters here: if a user already individually marked a story as read (with its own, possibly earlier, `read_at`) before marking the whole collection read, the cascade doesn't overwrite that date.

**Open product decision, not yet resolved:** if a user un-marks a collection as read, should that un-mark the individual stories? Current lean is **no** — they still read the stories, they just reconsidered the collection-level checkbox — so no "un-cascade" trigger exists. Revisit this deliberately if it turns out to feel wrong in practice; it's a product call more than a schema one.

## Row Level Security

RLS is mandatory on every table below — never disable it to "make it work" locally. All policies are enforced at the database level, not just filtered in composables.

**`king_works` / `adaptations` / `adaptation_works` / `adaptation_short_stories`** — public read for everyone (including anon), no INSERT/UPDATE/DELETE policies at all (seed data is loaded via the Supabase CLI / migrations using the service role, which bypasses RLS — the app itself never writes to these tables).

```sql
create policy "king_works readable by everyone"
  on king_works for select
  using (true);
-- same pattern for adaptations, adaptation_works, and adaptation_short_stories
```

**`profiles`** — readable by everyone (needed for search/profile pages to resolve a username at all); writable only by the owning user.

```sql
create policy "profiles readable by everyone"
  on profiles for select
  using (true);

create policy "profiles updatable by owner"
  on profiles for update
  using (id = auth.uid());
```

**`user_books` / `user_book_editions` / `user_adaptations` / `user_short_story_reads`** — the important one. A row is readable if you own it, _or_ if the owner's profile is public. Writes (insert/update/delete) are owner-only, full stop — `is_public` never affects write access. The pattern is identical across all four tables.

```sql
create policy "user_books readable by owner or if profile public"
  on user_books for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_books.user_id
      and profiles.is_public = true
    )
  );

create policy "user_books writable by owner only"
  on user_books for insert
  with check (user_id = auth.uid());

create policy "user_books updatable by owner only"
  on user_books for update
  using (user_id = auth.uid());

create policy "user_books deletable by owner only"
  on user_books for delete
  using (user_id = auth.uid());
-- identical four-policy set for user_book_editions, user_adaptations, and user_short_story_reads
```

### Why this shape

- **Personal stats** ("books I own," "books I've read this year") need no special handling — a user can always read their own rows.
- **Public profile pages / bookshelves** ("visit Alice's collection") work naturally off the same SELECT policy above — no separate public/private table split needed.
- **Anonymous aggregate stats/leaderboards** ("The Stand: owned by 340 users") should be built as views or functions that `GROUP BY`/`COUNT` and never `SELECT` or join `profiles.username` — keeping them anonymous is a query-writing discipline, not an RLS requirement, since the underlying rows are already visible per the policy above. Don't accidentally leak a username into a "leaderboard" query — if a stats feature needs to attribute a count to a person by name, that's a different feature (a public profile stat), not an anonymous leaderboard, and should be built as its own explicit query.
- **The privacy toggle** lives entirely in `profiles.is_public` and is checked inside the RLS policy itself — never filter privacy in application code or in a composable. If a user flips `is_public` to `false`, their rows should disappear from others' view immediately and automatically, because the database enforces it, not the client.

## Statistics: query live, don't store counters

Aggregate stats (e.g. "most owned work") are computed with a plain SQL view, re-run each time they're read — **never** a stored/denormalized counter column kept in sync via triggers.

- No performance case exists yet for denormalizing at this project's scale; Postgres `GROUP BY`/`COUNT` over these join tables is cheap.
- A stored counter (e.g. `king_works.owner_count`) requires insert/delete triggers on the join table, a backfill job, and carries real drift risk (bulk deletes, direct SQL, a skipped trigger) — complexity with no upside here.
- A live view is always exactly correct with zero extra moving parts. If a stats query is ever genuinely too slow at scale, the upgrade path is a _materialized_ view refreshed on a schedule — never triggers — since stats don't need to-the-second accuracy the way RLS-gated ownership data does.

### `work_stats` — owned/read/currently-reading counts and read-through rate, per work

One row per `king_work`, computed with conditional aggregation (`count(*) filter (where ...)`) rather than separate views, since these are all just different counts over the same `user_books` rows. `left join`ed from `king_works` so a brand-new book with zero interactions still appears with `0` counts rather than being missing entirely.

```sql
create view work_stats as
select
  k.id as king_work_id,
  count(*) filter (where ub.owned) as owner_count,
  count(*) filter (where ub.read) as read_count,
  count(*) filter (where ub.currently_reading) as currently_reading_count,
  count(*) filter (where ub.owned and ub.read) as owners_who_read_count,
  case
    when count(*) filter (where ub.owned) > 0
    then count(*) filter (where ub.owned and ub.read)::numeric / count(*) filter (where ub.owned)
    else null
  end as read_through_rate
from king_works k
left join user_books ub on ub.king_work_id = k.id
group by k.id;
```

Same RLS inheritance as before: this runs with the querying user's permissions (no `security definer`), so every count here already reflects only the `user_books` rows visible per the RLS policy below — public profiles plus your own. Private collections don't skew any of these numbers.

**"Top 5" ranking is a query-time concern, not a view concern.** The view always returns every work's raw numbers; ordering and `limit` happen in the composable, so the same view can power several different leaderboards without needing a matching view per leaderboard:

```sql
-- Most read
select * from work_stats order by read_count desc limit 5;

-- Most currently being read
select * from work_stats order by currently_reading_count desc limit 5;

-- Most owned, least read (needs a minimum sample size — see below)
select * from work_stats where owner_count >= 5 order by read_through_rate asc limit 5;

-- Least owned, most read: books people read without owning much,
-- e.g. borrowed/library reads rather than personal copies.
-- NOT the same as sorting read_through_rate desc — that rate is a
-- percentage, independent of volume, and says nothing about ownership scale.
select king_work_id, read_count, owner_count,
       read_count::numeric / nullif(owner_count, 0) as read_to_own_ratio
from work_stats
where read_count >= 5
order by read_to_own_ratio desc
limit 5;
```

**Why `owner_count >= 5` matters for the first query:** `read_through_rate` is a ratio, and ratios are unstable on tiny samples — a work with exactly 1 owner who hasn't read it yet scores a "worst possible" 0% read-through, which is noise, not a meaningful result, and would otherwise dominate the top of the list ahead of a work with 200 owners and a genuinely low 20% read-through. Always gate ratio-based rankings on a minimum sample at query time; don't rank on a bare ratio alone. The threshold value (5, 10, whatever) is a display choice, not a schema concern — tune it in the composable/query, not the view, and expect to start it lower (2–3) than a mature app would, since a small early userbase means a threshold of 5 could exclude nearly every book at launch.

**Why the guard moves to `read_count >= 5` for the second query:** here the ratio's numerator is what's small-sample-prone — a single person reading a book nobody owns produces a technically-enormous but meaningless ratio. Guard whichever side of the ratio represents the "a lot of this happened" claim being made, not the same column every time.

### `short_story_stats` — read counts per short story

Short stories carry no ownership concept of their own (see `king_short_stories` above — they're never independently shelved), so this view is simpler than `work_stats`: just a read count, sourced from `user_short_story_reads` rather than `user_books`. Exists specifically so an adaptation sourced from a short story (see `adaptation_short_stories`) has something to compare its watch numbers against — without it, `adaptation_vs_source_stats` below would have no read-side data for those adaptations at all.

```sql
create view short_story_stats as
select
  s.id as short_story_id,
  count(*) as read_count
from king_short_stories s
left join user_short_story_reads usr on usr.short_story_id = s.id
group by s.id;
```

### `adaptation_stats` — want-to-watch/watched counts per adaptation

Same shape as `work_stats`, one table over:

```sql
create view adaptation_stats as
select
  a.id as adaptation_id,
  count(*) filter (where ua.want_to_watch) as want_to_watch_count,
  count(*) filter (where ua.watched) as watched_count
from adaptations a
left join user_adaptations ua on ua.adaptation_id = a.id
group by a.id;
```

"Most watched" is a plain `order by watched_count desc limit 5` against this view — no ratio, no guard needed, same as "most read" for books.

### Book vs. adaptation: popularity mismatch

The interesting stat — "this adaptation is watched a lot but its source isn't read much" and the mirror — compares `adaptation_stats` against **both** `work_stats` and `short_story_stats`, since an adaptation's source can be either kind (see `adaptation_works` and `adaptation_short_stories` above). The view unions both source types into one shape, tagged with `source_type`, rather than producing two separate, differently-shaped stats views that every consumer would need to know to check both of:

```sql
create view adaptation_vs_source_stats as
select
  aw.adaptation_id,
  'work' as source_type,
  aw.king_work_id as source_id,
  a_stats.watched_count,
  w_stats.read_count
from adaptation_works aw
join adaptation_stats a_stats on a_stats.adaptation_id = aw.adaptation_id
join work_stats w_stats on w_stats.king_work_id = aw.king_work_id
union all
select
  ass.adaptation_id,
  'short_story' as source_type,
  ass.short_story_id as source_id,
  a_stats.watched_count,
  ss_stats.read_count
from adaptation_short_stories ass
join adaptation_stats a_stats on a_stats.adaptation_id = ass.adaptation_id
join short_story_stats ss_stats on ss_stats.short_story_id = ass.short_story_id;
```

This is why `adaptation_short_stories` and `short_story_stats` exist at all rather than the app just tolerating a gap: without this union, an adaptation whose only source is a short story or novella — Stand By Me, The Shawshank Redemption, Creepshow — would join to nothing in the old `adaptation_works`-only version of this view and silently disappear from every "book popular, movie under-watched" or "movie popular, book under-read" leaderboard, despite some of those being among the most iconic King adaptations that exist.

Same ratio-with-a-guard-on-the-numerator-side pattern as the owned-vs-read stat, just spanning `source_type` now instead of a single fixed table:

```sql
-- Adaptation popular, source under-read (e.g. "everyone's seen the movie, few read the book/story")
select source_type, source_id, adaptation_id, watched_count, read_count,
       watched_count::numeric / nullif(read_count, 0) as watched_to_read_ratio
from adaptation_vs_source_stats
where watched_count >= 5
order by watched_to_read_ratio desc
limit 5;

-- Source well-read, its adaptation under-watched (the mirror)
select source_type, source_id, adaptation_id, watched_count, read_count,
       read_count::numeric / nullif(watched_count, 0) as read_to_watched_ratio
from adaptation_vs_source_stats
where read_count >= 5
order by read_to_watched_ratio desc
limit 5;
```

Guard on whichever count is making the "popular" claim in each direction — `watched_count` for the first query, `read_count` for the second — same reasoning as the least-owned-most-read stat: a ratio is only meaningful once its "big" side has enough samples to not be noise. `source_type` in the result tells the composable whether `source_id` resolves against `king_works` or `king_short_stories` when it goes to fetch the title to display.

## Reading progress by category

A different kind of stat from everything above: **per-user completion percentage** ("42% through the Dark Tower"), not an aggregate across users. Categories: all works, Bachman, Dark Tower — and Dark Tower completion must include short stories now that they carry `dark_tower`, or a user could own/read every `king_works` Dark Tower entry and still never see 100%.

The complication is that "read" is represented differently in each table (a boolean on `user_books`, row-existence in `user_short_story_reads`), so both need normalizing into one shape before they can be counted together. Two views:

**`bibliography_items`** — every work and every short story, unioned into one list with consistent category flags. This is the denominator for any category.

```sql
create view bibliography_items as
select
  id,
  'work' as item_type,
  dark_tower,
  bachman
from king_works
union all
select
  id,
  'short_story' as item_type,
  dark_tower,
  false as bachman  -- no short story was published under the Bachman pseudonym
from king_short_stories;
```

**`user_read_items`** — the same union, restricted to what a given user has actually read. This is the numerator.

```sql
create view user_read_items as
select
  ub.user_id,
  bi.item_type,
  bi.dark_tower,
  bi.bachman
from bibliography_items bi
join user_books ub on ub.king_work_id = bi.id and bi.item_type = 'work' and ub.read = true
union all
select
  usr.user_id,
  bi.item_type,
  bi.dark_tower,
  false as bachman
from bibliography_items bi
join user_short_story_reads usr on usr.short_story_id = bi.id and bi.item_type = 'short_story';
```

This inherits RLS the same way every other view here does — no `security definer`, so it only ever shows read rows the querying user is allowed to see (their own, or a public profile's). That's what lets this same view power _either_ "my progress" _or_ "Alice's progress" on her public profile page, just by changing which `user_id` you filter on — the composable should accept a `userId` param here exactly like `useProfile()` does, rather than assuming `auth.uid()`.

Percentage itself is a query-time calculation, not a fourth view — the category filter changes per use case, and baking each one in would mean a new view every time someone wants a different slice:

```sql
-- Dark Tower completion for a given user (works + qualifying short stories)
select
  (select count(*) from user_read_items where user_id = $1 and dark_tower = true) as read_count,
  (select count(*) from bibliography_items where dark_tower = true) as total_count;

-- Bachman completion — short stories never match, so this is
-- effectively king_works-only without needing special-case logic
select
  (select count(*) from user_read_items where user_id = $1 and bachman = true) as read_count,
  (select count(*) from bibliography_items where bachman = true) as total_count;

-- All works (no category filter)
select
  (select count(*) from user_read_items where user_id = $1) as read_count,
  (select count(*) from bibliography_items) as total_count;
```

The composable divides `read_count / total_count` client-side (or in a small SQL function if you'd rather keep it server-side) — either is fine, since it's cheap arithmetic on two already-computed integers, not a query optimization concern.

## Conventions for composables

- One composable per table/domain: `useBooks()` (owned/wishlist/read flags on `user_books`), `useBookshelf()` (edition detail on `user_book_editions`), `useAdaptations()` (want-to-watch/watched flags on `user_adaptations`, plus read-only lookups against `adaptations`/`adaptation_works`/`adaptation_short_stories`), `useShortStories()` (read-only lookups against `king_short_stories`/`king_short_story_collections`, plus read tracking on `user_short_story_reads`), `useProfile()`.
- Building an adaptation's full "based on" list is `useAdaptations()`'s job: query `adaptation_works` and `adaptation_short_stories` for the same `adaptation_id` and merge the two result sets — never assume a given adaptation has rows in only one of the two tables. Check `is_universe_only` on the `adaptations` row itself before treating an empty result from both as a data gap rather than the expected state. For each short-story source, also resolve its parent collection(s) via `king_short_story_collections` → `king_works` and surface them in the "based on" display (e.g. "Children of the Corn — from Night Shift") so the user sees both the story and the collection.
- Building a collection's full "adapted in" list is also `useAdaptations()`'s job: query `adaptation_works` where `king_work_id` matches the collection **and** union in `adaptation_short_stories` joined through `king_short_story_collections` — see "Collection-level adaptation lookup" above. Never show only the direct `adaptation_works` results; that omits every single-story adaptation (e.g. Children of the Corn, Sometimes They Come Back) that makes the collection page worth having.
- Marking a collection as read (`useBooks()`) never needs to also touch `user_short_story_reads` directly — the DB trigger handles the cascade. Don't duplicate it in the composable.
- `useBooks()` needs three distinct write functions for the reading-date flows — `startReading(workId, startedOn)`, `finishReading(workId, finishedOn)`, and `markRead(workId, { startedOn?, finishedOn?, readYear? })` — rather than one generic "update status" function, since each corresponds to a different modal with different fields and different skip behavior (see "Reading dates" under `user_books` above). Compute the prefilled default date client-side from the browser's local date, never from a server timestamp.
- Category completion (`useReadingProgress()` or similar) queries `bibliography_items`/`user_read_items` and accepts a `userId` param rather than assuming `auth.uid()`, so it works identically for "my progress" and "their public-profile progress."
- Adding an edition is a two-write operation owned by `useBookshelf()`: insert the `user_book_editions` row, and upsert `owned = true` on the corresponding `user_books` row. Never let a component call one without the other — that's exactly the kind of duplicated logic composables exist to prevent.
- Composables should accept a `userId` param when reading _someone else's_ public data (e.g. viewing another user's profile page/bookshelf) rather than assuming `auth.uid()` — the RLS policy handles whether that read is actually allowed; the composable shouldn't duplicate that logic.
- Never write client-side checks like `if (profile.is_public)` to decide whether to _make_ a query — just make the query and let RLS return zero rows if it's not allowed. Duplicating the privacy check in JS invites the two getting out of sync.
- Status values (`wishlist` / `read`, `watchlist` / `watched`) should be typed as literal union types in TypeScript, not bare strings, and should match the DB constraint exactly (consider a `check` constraint on the column too).
- Cover URL construction goes through one shared helper (see "Cover images"), never inlined per-component.

## Migrations & seed files

- Schema changes go through Supabase CLI migrations (`supabase migration new ...`), never edited directly in the dashboard for anything beyond local experimentation.
- Seed files live in `supabase/seed/` as JSON, applied via `supabase db seed` or a small loader script — not SQL `insert` statements hand-maintained inline in a migration, so the canonical bibliography stays easy to diff and edit. Current set: `king_works.json`, `king_short_stories.json`, `king_short_story_collections.json`, `adaptations.json`, `adaptation_works.json`, `adaptation_short_stories.json`.
- **A loader script needs the service role key, not the anon key.** These tables have no insert policy at all — not even for authenticated users — so a normal client call can't write to them regardless of whose key it uses; only the service role key bypasses RLS. That means the anon-key env files used for local dev and for the deployed app (see below) can never seed anything on their own.
- **Local and hosted seeding are separate, explicitly-named `package.json` scripts, not one script with a runtime flag** — e.g. `seed:king-works` / `seed:king-works:hosted`, `seed:bibliography` / `seed:bibliography:hosted`. Given a fat-fingered target here means writing to a database with real user data, the cost of two near-identical script entries is worth it over one script where "which environment" is a flag someone has to remember to set correctly every time.
  - `seed:*` (no suffix) reads the local dev env file and seeds local Supabase — safe to run repeatedly, part of normal local iteration.
  - `seed:*:hosted` reads a **separate, gitignored admin env file** — not the local dev file, and not anything Vercel reads — holding hosted's URL and hosted's service role key specifically. This file is never loaded by the running app in any context (local or deployed); it exists solely for these scripts to read when deliberately run.
- **The deployed app's env (Vercel) never has a service role key at all** — with one narrow, deliberate exception: account deletion (`server/api/account.delete.ts`) must call `auth.admin.deleteUser`, which only an elevated key can do. That route reads a server-only `NUXT_SUPABASE_SECRET_KEY` env var (the `@nuxtjs/supabase` module's own admin-key convention, via its `serverSupabaseServiceRole()` helper) — distinct from `SUPABASE_SERVICE_ROLE_KEY` above, which stays script-only and is never read by the running app. `NUXT_SUPABASE_SECRET_KEY` is never in `runtimeConfig.public`, so it's never bundled to the client, and it's used only after verifying the caller's own session — never to act on an arbitrary user ID from the client. Every other table/feature still follows the plain rule: no service-role key in the deployed app.
