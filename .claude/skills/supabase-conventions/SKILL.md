---
name: supabase-conventions
description: Database schema, RLS policies, and query conventions for the Stephen King Library app's Supabase backend. Use this whenever writing or modifying anything that touches the database — Supabase queries, composables, migrations, RLS policies, seed files, or the tables king_works, adaptations, profiles, user_books, or user_adaptations. Also use when adding any feature that reads or writes user collections, wishlists, read status, watch status, or statistics/leaderboards, since these all depend on this schema. Consult this skill before writing a single `supabase.from(...)` call anywhere in the app.
---

# Supabase Conventions — Stephen King Library

This skill is the source of truth for the database schema and how to interact with it. Do not invent tables, columns, or RLS policies that aren't described here — if a feature needs something not covered, stop and ask rather than improvising a schema change.

## Core rule: queries only via composables

No `.vue` file ever calls `supabase.from(...)` directly. Every table gets a composable (e.g. `useBooks`, `useAdaptations`, `useProfile`) that wraps reads/writes for that table. This keeps RLS-dependent query logic (see below) in one place instead of scattered across components.

## Schema

### `king_works` (seed-file-driven, read-only at runtime)
| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `title` | text | |
| `type` | text | `novel` / `short_story` / `collection` / etc. |
| `original_publish_year` | int | |
| `open_library_work_key` | text, nullable | for matching against Open Library search |

Maintained in `supabase/seed/king_works.json` (or `.sql`), checked into the repo. Adding a new King book = editing the seed file + redeploying the seed — **never** a runtime insert/update from the app, and there is no UI for editing this table.

### `adaptations` (seed-file-driven, read-only at runtime)
| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `title` | text | |
| `king_work_id` | uuid, FK → `king_works.id`, nullable | nullable because some adaptations don't map cleanly to one book |
| `type` | text | `movie` / `tv_series` / `tv_movie` etc. |
| `release_year` | int | |
| `tmdb_id` | int, nullable | for matching against TMDb |

Same maintenance pattern as `king_works`: seed file in the repo (`supabase/seed/adaptations.json`), redeployed on change, no runtime CRUD.

### `profiles` (public directory of users)
| column | type | notes |
|---|---|---|
| `id` | uuid, PK, FK → `auth.users.id` | |
| `username` | text, unique | |
| `avatar_url` | text, nullable | |
| `is_public` | boolean, default `true` | gates visibility of this user's **collections** (see RLS below) — the profile row itself (username) is always readable |
| `created_at` | timestamptz, default `now()` | |

`auth.users` is never exposed to the client directly (it holds emails, password hashes, etc.), which is exactly why `profiles` exists — it's the public-safe mirror. A row is created automatically via a trigger on `auth.users` insert (`handle_new_user()` function, `SECURITY DEFINER`) — never insert into `profiles` from client code.

### `user_books` (join table: user ↔ king_work)
| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users.id` | |
| `king_work_id` | uuid, FK → `king_works.id` | |
| `edition_id` | text, nullable | Open Library edition ID — only stored once a user picks an edition, never cached/synced beyond this reference |
| `edition_title` | text, nullable | denormalized title snapshot, paired with `edition_id` |
| `status` | text | `wishlist` / `to_read` / `read` |
| `read_at` | timestamptz, nullable | |

### `user_adaptations` (join table: user ↔ adaptation)
| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users.id` | |
| `adaptation_id` | uuid, FK → `adaptations.id` | |
| `status` | text | `watchlist` / `watched` |
| `watched_at` | timestamptz, nullable | |

**No standalone `editions` table.** Open Library is the source of truth for edition data (cover, ISBN, publisher, etc.) and is queried live via `openlibrary-integration`. We only ever persist a reference (id + title) once a user actually adds an edition to their collection — never a full cached copy, and never speculative caching of editions a user hasn't chosen.

## Row Level Security

RLS is mandatory on every table below — never disable it to "make it work" locally. All policies are enforced at the database level, not just filtered in composables.

**`king_works` / `adaptations`** — public read for everyone (including anon), no INSERT/UPDATE/DELETE policies at all (seed data is loaded via the Supabase CLI / migrations using the service role, which bypasses RLS — the app itself never writes to these tables).

```sql
create policy "king_works readable by everyone"
  on king_works for select
  using (true);
-- same pattern for adaptations
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

**`user_books` / `user_adaptations`** — the important one. A row is readable if you own it, *or* if the owner's profile is public. Writes (insert/update/delete) are owner-only, full stop — `is_public` never affects write access.

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
-- identical four policies for user_adaptations
```

### Why this shape

- **Personal stats** ("books I've read this year") need no special handling — a user can always read their own rows.
- **Public profile pages** ("visit Alice's collection") work naturally off the same SELECT policy above — no separate public/private table split needed.
- **Anonymous aggregate stats/leaderboards** ("The Stand: read by 340 users") should be built as views or functions that `GROUP BY`/`COUNT` and never `SELECT` or join `profiles.username` — keeping them anonymous is a query-writing discipline, not an RLS requirement, since the underlying rows are already visible per the policy above. Don't accidentally leak a username into a "leaderboard" query — if a stats feature needs to attribute a count to a person by name, that's a different feature (a public profile stat), not an anonymous leaderboard, and should be built as its own explicit query.
- **The privacy toggle** lives entirely in `profiles.is_public` and is checked inside the RLS policy itself — never filter privacy in application code or in a composable. If a user flips `is_public` to `false`, their rows should disappear from others' view immediately and automatically, because the database enforces it, not the client.

## Conventions for composables

- One composable per table/domain: `useBooks()`, `useAdaptations()`, `useProfile()`.
- Composables should accept a `userId` param when reading *someone else's* public data (e.g. viewing another user's profile page) rather than assuming `auth.uid()` — the RLS policy handles whether that read is actually allowed; the composable shouldn't duplicate that logic.
- Never write client-side checks like `if (profile.is_public)` to decide whether to *make* a query — just make the query and let RLS return zero rows if it's not allowed. Duplicating the privacy check in JS invites the two getting out of sync.
- Status values (`wishlist` / `to_read` / `read`, `watchlist` / `watched`) should be typed as literal union types in TypeScript, not bare strings, and should match the DB constraint exactly (consider a `check` constraint on the column too).

## Migrations & seed files

- Schema changes go through Supabase CLI migrations (`supabase migration new ...`), never edited directly in the dashboard for anything beyond local experimentation.
- `king_works` and `adaptations` seed files live in `supabase/seed/` as JSON, applied via `supabase db seed` or a small loader script — not SQL `insert` statements hand-maintained inline in a migration, so the canonical bibliography stays easy to diff and edit.
