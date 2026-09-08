## Context

See `proposal.md` for motivation. Relevant existing state (from `supabase-conventions` and the current migrations):

- `profiles` is already public-read regardless of `is_public` (`using (true)`); `is_public` only gates `user_books`/`user_adaptations` row visibility.
- `work_stats` (per-work `read_count`, `currently_reading_count`, `want_to_read_count`, `owner_count`, …) and `adaptation_stats` (per-adaptation `want_to_watch_count`, `watched_count`) are live views, `grant select`ed to `anon` and `authenticated`, with no `security definer` — they inherit RLS from the querying role, so an anonymous or non-owner query only counts rows from public profiles. `supabase-conventions` treats this as the intended shape for "anonymous aggregate stats/leaderboards" everywhere else in the app (work detail pages, etc.), not something to special-case here.
- `king_works` is seed-file-driven and read-only at runtime; the only writes come from `supabase db push`-applied migrations and seed-loader scripts running with the service role (which bypasses RLS).

## Goals / Non-Goals

**Goals:**
- Reuse `work_stats`/`adaptation_stats` as-is for every leaderboard and the read/watched totals — no new stats views, no privilege escalation.
- Make "Book of the week" and "new book → next shuffle position" self-maintaining at the database level, since `king_works` has no admin UI and is only ever touched via migrations/seed scripts.
- Keep the homepage's data access behind one composable, per `supabase-conventions`'s "no direct `supabase.from(...)` in `.vue`" rule.

**Non-Goals:**
- Not building a general-purpose "site analytics" feature — just the specific counts/leaderboards this proposal lists.
- Not changing `work_stats`/`adaptation_stats`'s privacy scoping. A private profile's reads/watches already don't count toward these views anywhere else in the app; the homepage doesn't get an exception. (The one genuine exception, the fan count, isn't a privacy bypass at all — `profiles` was already fully public-read before this change.)
- Not building an editorial/admin tool for curating Book of the week — it stays fully deterministic and automatic.

## Decisions

### Book of the week: `shuffle_position` + ISO week modulo

Add `king_works.shuffle_position integer not null unique`. One-time backfill shuffles the existing rows into a random permutation of `0..N-1`; from then on, a `before insert` trigger assigns `coalesce((select max(shuffle_position) from king_works), -1) + 1` whenever a new row arrives with `shuffle_position` left null, so the seed loader never needs to know the current max itself.

Query at read time (no new view needed — one row lookup):
```sql
select *
from king_works
where shuffle_position = (
  select extract(week from current_date)::int % (select count(*) from king_works)
)
and original_publish_date <= current_date;
```
Wait — the modulo needs `count(*)` computed once; simplest as a two-step read in the composable (fetch `count(*)`, compute `isoWeek % count` in JS, then fetch the matching row) rather than a nested subquery repeated per request. Either is fine; the composable can pick whichever reads more clearly, since this is a single cheap lookup either way.

**Alternative considered**: store an explicit `(week_number, king_work_id)` rotation table, curated manually. Rejected — the proposal explicitly asks for "no manual list to maintain," and the modulo approach gives a stable, gap-free rotation automatically as the bibliography grows.

**Migration ordering**: per `supabase-conventions`'s two-migration pattern for a `not null` column on an already-populated table, this ships as (1) add `shuffle_position` nullable, (2) backfill via a one-off script that shuffles and writes every existing row's position, (3) a third migration sets `not null unique` and adds the auto-assignment trigger. This keeps the change confined to `king_works`, zero blast radius on `auth.users`/`profiles`/`user_*`.

### Least read book: tie-break on `shuffle_position`

"Lowest `read_count` among released works" can tie (e.g. two very new books both at 0). The spec requires a stable choice rather than one that flips on every load. Since `shuffle_position` is already a unique, stable integer per work, use it as the tie-break: `order by read_count asc, shuffle_position asc limit 1`. No new column needed for this.

### Reusing `work_stats` / `adaptation_stats` directly

All four leaderboards (most/least read, currently reading, most/least watched) and the two stats-bar totals (books read, adaptations watched) are plain `order by`/`sum` queries against the existing views:

```sql
-- Most read / currently reading (top 5)
select * from work_stats order by read_count desc limit 5;
select * from work_stats order by currently_reading_count desc limit 5;

-- Total books read / adaptations watched (stats bar)
select sum(read_count) from work_stats;
select sum(watched_count) from adaptation_stats;

-- Most / least watched adaptations (top 5 / bottom 5)
select * from adaptation_stats order by watched_count desc limit 5;
select * from adaptation_stats order by watched_count asc limit 5;
```
No minimum-sample guard is needed here (unlike `read_through_rate` elsewhere) since these are plain counts, not ratios.

### Fan count: plain `count(*)` on `profiles`

```sql
select count(*) from profiles;
```
No RLS change, no new policy — `profiles` is already `using (true)` for select.

### Composable shape

One new composable, `useHomepage()`, following the existing one-composable-per-domain convention: wraps the profile count, the `work_stats`/`adaptation_stats`-backed leaderboards and totals, book of the week, book birthday, and least-read lookup. It does not duplicate `useBooks()`/`useAdaptations()` write logic — reading-status/watch actions triggered from the homepage (e.g. starting the least-read book) call those existing composables, same as the profile showcase does for its Currently Reading finish action.

### UI composition

`app/pages/index.vue` is rewritten using `UPageHero` (as today) for the auth-aware hero, then a two-column grid section built from Nuxt UI primitives (`UCard`/`UBadge`/etc., per `nuxt-conventions`) for the stats/leaderboard content, then two closing `UPageCTA` blocks (Works, then Adaptations) — the same component already used for those two sections today. Leaderboard/spotlight cards likely reuse the visual language already established in `app/components/profile/*` (progress bars, showcase-style cards) rather than inventing a new visual style, per the request that this page feel "similar to the profile page."

## Risks / Trade-offs

- **[Risk]** `shuffle_position`'s one-time shuffle is a script run once during migration; if it's ever re-run accidentally, previously-featured books reshuffle to new positions (not destructive, but changes which book is "of the week" going forward). → **Mitigation**: the backfill only ever targets rows where `shuffle_position is null`, so it's naturally idempotent — already-assigned rows are untouched even if the script runs again.
- **[Risk]** Computing `isoWeek % count(*)` in two round trips (count, then row lookup) instead of one query is a minor extra request. → **Mitigation**: negligible cost for a single homepage load; not worth a stored-procedure round-trip savings here.
- **[Trade-off]** Site-wide totals/leaderboards under-count relative to true global totals when private profiles exist, since `work_stats`/`adaptation_stats` inherit RLS. → Accepted: this is the existing, established behavior for every other consumer of these views, and the proposal's own reasoning (aggregate, non-identifying) doesn't require bypassing it — only the fan count needed an explicit call-out, and that one turned out to need no bypass at all.

## Migration Plan

1. Migration: add `king_works.shuffle_position integer` (nullable).
2. One-off backfill script (local, then hosted after go-ahead per `supabase-conventions`): shuffle all existing rows into `0..N-1`.
3. Migration: set `shuffle_position not null unique`, add `assign_shuffle_position()` trigger (`before insert`, fills in the next available value when null).
4. Rewrite `app/pages/index.vue` and add `useHomepage()` — no further schema changes needed, since every other data need is already served by existing views/tables.

Rollback: the two `king_works` migrations are additive (new nullable-then-constrained column + trigger) and can be reverted with a straightforward down migration dropping the column and trigger; no other table is touched.
