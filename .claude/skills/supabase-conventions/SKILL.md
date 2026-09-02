---
name: supabase-conventions
description: Database schema, RLS policies, and query conventions for the Stephen King Library app's Supabase backend. Use this whenever writing or modifying anything that touches the database — Supabase queries, composables, migrations, RLS policies, seed files, or the tables king_works, adaptations, adaptation_works, profiles, user_books, user_book_editions, or user_adaptations. Also use when adding any feature that reads or writes user collections, wishlists, read status, watch status, cover images, or statistics/leaderboards, since these all depend on this schema. Consult this skill before writing a single `supabase.from(...)` call anywhere in the app.
---

# Supabase Conventions — Stephen King Library

This skill is the source of truth for the database schema and how to interact with it. Do not invent tables, columns, or RLS policies that aren't described here — if a feature needs something not covered, stop and ask rather than improvising a schema change.

## Core rule: queries only via composables

No `.vue` file ever calls `supabase.from(...)` directly. Every table gets a composable (e.g. `useBooks`, `useAdaptations`, `useProfile`) that wraps reads/writes for that table. This keeps RLS-dependent query logic (see below) in one place instead of scattered across components.

## Schema

### `king_works` (seed-file-driven, read-only at runtime)

| column                  | type                     | notes                                                                                                                                                                                                |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                    | uuid, PK                 |                                                                                                                                                                                                      |
| `title`                 | text                     |                                                                                                                                                                                                      |
| `type`                  | text                     | `novel` / `short_story` / `collection` / etc.                                                                                                                                                        |
| `original_publish_year` | int                      |                                                                                                                                                                                                      |
| `open_library_work_key` | text, nullable           | for matching against Open Library search                                                                                                                                                             |
| `dark_tower`            | boolean, default `false` | `true` only for works that are part of the core Dark Tower series — not for works merely connected to it (see `dark_tower_relation`)                                                                 |
| `bachman`               | boolean, default `false` | `true` for works published under the Richard Bachman pseudonym                                                                                                                                       |
| `dark_tower_relation`   | text, nullable           | free-text note on how the work connects to the Dark Tower series (for series-proper works and for outside works sharing characters/settings/events with it); `null` means no connection worth noting |

Maintained in `supabase/seed/king_works.json` (or `.sql`), checked into the repo. Adding a new King book = editing the seed file + redeploying the seed — **never** a runtime insert/update from the app, and there is no UI for editing this table.

### `adaptations` (seed-file-driven, read-only at runtime)

| column         | type          | notes                                   |
| -------------- | ------------- | --------------------------------------- |
| `id`           | uuid, PK      |                                         |
| `title`        | text          |                                         |
| `type`         | text          | `movie` / `tv_series` / `tv_movie` etc. |
| `release_year` | int           |                                         |
| `tmdb_id`      | int, nullable | for matching against TMDb               |

Same maintenance pattern as `king_works`: seed file in the repo (`supabase/seed/adaptations.json`), redeployed on change, no runtime CRUD. Its relationship to source works is handled by `adaptation_works` below, not by a column on this table.

### `adaptation_works` (seed-file-driven, read-only at runtime — links adaptations to works)

A proper many-to-many join, not a single FK column on `adaptations`, because some adaptations draw on more than one work (King's universe is heavily cross-referential — a nullable single `king_work_id` would force picking one "primary" source and lose the rest).

| column          | type                        | notes |
| --------------- | --------------------------- | ----- |
| `id`            | uuid, PK                    |       |
| `adaptation_id` | uuid, FK → `adaptations.id` |       |
| `king_work_id`  | uuid, FK → `king_works.id`  |       |

Unique constraint on `(adaptation_id, king_work_id)`. Same seed-file maintenance pattern as `king_works`/`adaptations` — this is curated bibliography data, not user data, so it's maintained in `supabase/seed/adaptation_works.json` and redeployed on change, never written at runtime.

A work's detail page queries this table filtered by `king_work_id` to list its adaptations; an adaptation's detail page queries it filtered by `adaptation_id` to list its source work(s).

### `profiles` (public directory of users)

| column       | type                           | notes                                                                                                                  |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `id`         | uuid, PK, FK → `auth.users.id` |                                                                                                                        |
| `username`   | text, unique                   |                                                                                                                        |
| `avatar_url` | text, nullable                 |                                                                                                                        |
| `is_public`  | boolean, default `true`        | gates visibility of this user's **collections** (see RLS below) — the profile row itself (username) is always readable |
| `created_at` | timestamptz, default `now()`   |                                                                                                                        |

`auth.users` is never exposed to the client directly (it holds emails, password hashes, etc.), which is exactly why `profiles` exists — it's the public-safe mirror. A row is created automatically via a trigger on `auth.users` insert (`handle_new_user()` function, `SECURITY DEFINER`) — never insert into `profiles` from client code.

### `user_books` (join table: user ↔ king_work — the single source of truth for the relationship)

One row per `(user_id, king_work_id)`. This is the authoritative record of whether a work is owned, wishlisted, and/or read — **ownership does not require an edition to be selected.** Editions (below) are optional supplementary detail a collector may attach on top of this.

| column              | type                       | notes                                                                                                                                                            |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | uuid, PK                   |                                                                                                                                                                  |
| `user_id`           | uuid, FK → `auth.users.id` |                                                                                                                                                                  |
| `king_work_id`      | uuid, FK → `king_works.id` |                                                                                                                                                                  |
| `owned`             | boolean, default `false`   | generic "I own this work" — true whether or not any edition has been picked                                                                                      |
| `wishlisted`        | boolean, default `false`   | wants to _own_ it (see Triggers: cleared when `owned` becomes true)                                                                                              |
| `want_to_read`      | boolean, default `false`   | wants to _read_ it — a separate intent from wanting to own; see Triggers                                                                                         |
| `currently_reading` | boolean, default `false`   | supports being mid-read on several works at once — this is a per-row flag, so "reading 3 books" is just 3 rows each with this `true`, no special handling needed |
| `started_at`        | timestamptz, nullable      | set when `currently_reading` flips to `true`                                                                                                                     |
| `read`              | boolean, default `false`   |                                                                                                                                                                  |
| `read_at`           | timestamptz, nullable      |                                                                                                                                                                  |

These are independent booleans, not an enum — a work can be `owned` _and_ `read` _and_ have previously been `wishlisted`; forcing a single `status` would lose that. Unique constraint on `(user_id, king_work_id)` — this is the one row per user per work.

**Invariants**, all enforced with database triggers, not client-side logic — see "Triggers" below:

- A work is never simultaneously `owned` and `wishlisted`.
- Marking `read = true` clears both `want_to_read` and `currently_reading`.
- Marking `currently_reading = true` clears `want_to_read` (you've moved past "want to" into "doing it").

Wishlisting/want-to-read are work-level only (no edition selection) — this app isn't trying to support "wishlist a specific first edition."

**Known limitation, deliberately accepted for now:** `started_at`/`read_at` each hold only the most recent value — rereading a work overwrites them rather than preserving history. If reread tracking becomes a real feature later (a "read 3 times" stat, a reread log), that's a new table (e.g. `read_events`, one row per read cycle) layered on top, not a change to these two columns — don't retrofit history into single-timestamp fields.

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
- Do not add a `cover_url` or `cover_id` column anywhere — it would duplicate what's derivable from `edition_id` / `open_library_work_key` and risks drifting if Open Library's URL scheme ever changes (fix the helper in one place instead).
- Do not download/store the actual image bytes in Supabase Storage. This would mean self-hosting copyrighted publisher artwork rather than linking to a source licensed to serve it, plus added storage cost and cache-invalidation complexity, for a project with no offline-data requirement (PWA is install-prompt-only).
- If Open Library image delivery ever proves unreliable in practice, the fix is a thin caching image-proxy edge function — not bulk-copying files into Storage. Not needed at this stage.

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

## Row Level Security

RLS is mandatory on every table below — never disable it to "make it work" locally. All policies are enforced at the database level, not just filtered in composables.

**`king_works` / `adaptations` / `adaptation_works`** — public read for everyone (including anon), no INSERT/UPDATE/DELETE policies at all (seed data is loaded via the Supabase CLI / migrations using the service role, which bypasses RLS — the app itself never writes to these tables).

```sql
create policy "king_works readable by everyone"
  on king_works for select
  using (true);
-- same pattern for adaptations and adaptation_works
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

**`user_books` / `user_book_editions` / `user_adaptations`** — the important one. A row is readable if you own it, _or_ if the owner's profile is public. Writes (insert/update/delete) are owner-only, full stop — `is_public` never affects write access. The pattern is identical across all three tables.

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
-- identical four-policy set for user_book_editions and user_adaptations
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

The interesting stat — "this adaptation is watched a lot but its source book isn't read much" and the mirror — compares `work_stats` and `adaptation_stats` across the `adaptation_works` link, per linked pair (not collapsed to one number per adaptation, since an adaptation can link to more than one work):

```sql
create view adaptation_vs_work_stats as
select
  aw.adaptation_id,
  aw.king_work_id,
  a_stats.watched_count,
  w_stats.read_count
from adaptation_works aw
join adaptation_stats a_stats on a_stats.adaptation_id = aw.adaptation_id
join work_stats w_stats on w_stats.king_work_id = aw.king_work_id;
```

Same ratio-with-a-guard-on-the-numerator-side pattern as the owned-vs-read stat, just spanning two tables now:

```sql
-- Adaptation popular, source book under-read (e.g. "everyone's seen the movie, few read the book")
select king_work_id, adaptation_id, watched_count, read_count,
       watched_count::numeric / nullif(read_count, 0) as watched_to_read_ratio
from adaptation_vs_work_stats
where watched_count >= 5
order by watched_to_read_ratio desc
limit 5;

-- Book well-read, its adaptation under-watched (the mirror)
select king_work_id, adaptation_id, watched_count, read_count,
       read_count::numeric / nullif(watched_count, 0) as read_to_watched_ratio
from adaptation_vs_work_stats
where read_count >= 5
order by read_to_watched_ratio desc
limit 5;
```

Guard on whichever count is making the "popular" claim in each direction — `watched_count` for the first query, `read_count` for the second — same reasoning as the least-owned-most-read stat: a ratio is only meaningful once its "big" side has enough samples to not be noise.

## Conventions for composables

- One composable per table/domain: `useBooks()` (owned/wishlist/read flags on `user_books`), `useBookshelf()` (edition detail on `user_book_editions`), `useAdaptations()` (want-to-watch/watched flags on `user_adaptations`, plus read-only lookups against `adaptations`/`adaptation_works`), `useProfile()`.
- Adding an edition is a two-write operation owned by `useBookshelf()`: insert the `user_book_editions` row, and upsert `owned = true` on the corresponding `user_books` row. Never let a component call one without the other — that's exactly the kind of duplicated logic composables exist to prevent.
- Composables should accept a `userId` param when reading _someone else's_ public data (e.g. viewing another user's profile page/bookshelf) rather than assuming `auth.uid()` — the RLS policy handles whether that read is actually allowed; the composable shouldn't duplicate that logic.
- Never write client-side checks like `if (profile.is_public)` to decide whether to _make_ a query — just make the query and let RLS return zero rows if it's not allowed. Duplicating the privacy check in JS invites the two getting out of sync.
- Status values (`wishlist` / `read`, `watchlist` / `watched`) should be typed as literal union types in TypeScript, not bare strings, and should match the DB constraint exactly (consider a `check` constraint on the column too).
- Cover URL construction goes through one shared helper (see "Cover images"), never inlined per-component.

## Migrations & seed files

- Schema changes go through Supabase CLI migrations (`supabase migration new ...`), never edited directly in the dashboard for anything beyond local experimentation.
- `king_works` and `adaptations` seed files live in `supabase/seed/` as JSON, applied via `supabase db seed` or a small loader script — not SQL `insert` statements hand-maintained inline in a migration, so the canonical bibliography stays easy to diff and edit.
