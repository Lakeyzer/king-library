## Context

`king_works` and `adaptations` are curated, seed-file-driven tables with RLS forbidding any client write (see `king-works` and `adaptations` specs). Every browsing list, detail page, the homepage's stats/leaderboards/spotlights, global search, and the profile showcase (progress bars, Currently Reading, Bookshelf, recommendations) all read from these two tables or from `user_books`/`user_adaptations` joined against them. Per `supabase-conventions`, all of these reads already go through composables (`useBooks`, `useAdaptations`, etc.) rather than ad-hoc `supabase.from(...)` calls in components — see proposal.md for why a soft "take out of circulation" flag is needed instead of deleting rows.

## Goals / Non-Goals

**Goals:**
- One `active` column per table, defaulting to `true`, that a curator can flip to remove a work or adaptation from every user-facing surface without touching `user_books`/`user_adaptations` history or breaking foreign keys.
- Centralize the filter in the composable layer so every consumer (browsing, details, search, homepage, showcase) inherits it automatically rather than re-implementing an `active` check per page.

**Non-Goals:**
- No admin UI for toggling `active` — it's set the same way the rest of the canonical bibliography/catalog is curated (seed data + migration), consistent with "no client-side writes."
- No change to short stories or short-story collections.
- No retroactive cleanup of `user_books`/`user_adaptations` rows for works/adaptations that become inactive — they're left as historical data, just excluded from anything rendered.
- No change to the not-yet-archived `profile-compare` capability; it can pick up the same filtering in a follow-up once it's synced into the main specs.

## Decisions

**Filter once, in the composable, not per-page.** `useBooks`/`useAdaptations` already own every read of `king_works`/`adaptations`. Add `.eq('active', true)` to their display-facing query builders (list-all, by-slug, and any joined stats/aggregate queries) so works-browsing, work-details, homepage, global-search, and profile-showcase all get the filter for free instead of six separate call sites each remembering to add it. Alternative considered: a Postgres view (`active_king_works`) that pre-filters — rejected for now since RLS + a straight column predicate is simpler and keeps the seed/migration story unchanged; can revisit if the number of call sites grows.

**By-slug fetch treats inactive as not-found, not as "found but hidden."** The `king-works` and `adaptations` deltas change the by-slug fetch itself to exclude inactive rows, so work-details/adaptation-details get a 404 automatically rather than each detail page needing its own inactive-check-then-404 branch.

**Book of the week rotation re-indexes over the active subset.** The existing scheme (ISO week number modulo total works, matched against `shuffle_position`) assumes shuffle positions are dense and gap-free across *all* works. Once inactive works are excluded, the rotation must compute `ISO week mod (count of active works)` and pick the nth-lowest `shuffle_position` *among active works* — not filter by raw `shuffle_position = week mod total` after the fact, which would skip weeks whenever an inactive work's position falls in the sequence. This is a query/computation change inside the existing "Book of the week" logic, not a new column.

**Cross-links (adaptation → source works, work → source adaptations) filter on the joined side.** `work-details`' "connected adaptations" and `adaptation-details`' "based on" list both join through link tables (`adaptation_works`, `adaptation_short_stories`) — the fix is adding the `active` predicate on the joined `king_works`/`adaptations` side of those queries, not on the link tables themselves (which have no `active` column and don't need one).

## Risks / Trade-offs

- **Missed call site** → a query added later that reads `king_works`/`adaptations` directly instead of through the shared composable helpers would leak inactive rows. Mitigated by the existing "all Supabase queries go through composables" convention (`CLAUDE.md`) plus `code-review`/`supabase-conventions` catching direct `supabase.from(...)` calls in `.vue` files.
- **Book of the week off-by-one during a transition week** → if a work is deactivated mid-week after that week's selection already ran client-side, different visitors could briefly see different results depending on cache timing. Low-impact (cosmetic, self-corrects next request) — no mitigation beyond normal query freshness.

## Migration Plan

1. Add the migration: `alter table king_works add column active boolean not null default true;` and the same for `adaptations`. Push to hosted Supabase before merging, per this project's release process (hosted schema must be live before the code that assumes it deploys).
2. Update seed data (`supabase/seed/*.json`) to include `active: true` for existing rows (harmless with the column default, but keeps seed files authoritative).
3. Update composables' query builders to filter `active = true` on display-facing reads.
4. No backfill or data migration needed — the default `true` preserves current behavior for every existing row until a curator explicitly deactivates one.
