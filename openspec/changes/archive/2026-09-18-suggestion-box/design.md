## Context

See proposal.md - Why. This introduces a new table (`suggestions`) with a new RLS shape not yet used elsewhere in the schema — every existing table is either public-read or owner-or-public-profile-read (see `supabase-conventions`), but a suggestion has no per-row owner-controlled privacy; visibility is "any signed-in user," full stop. It also needs to reconcile "always record who posted" with "sometimes display them as anonymous," which existing tables don't have a precedent for either.

## Goals / Non-Goals

**Goals:**
- Define the `suggestions` table shape and its RLS policies.
- Define how anonymous display is achieved without leaking the poster's identity through the read path.
- Define how an admin is identified and how status updates are gated to admins only.
- Define the voting table/RLS shape and how a correct, live vote score reaches the list despite RLS.

**Non-Goals:**
- Editing a suggestion's title/body once submitted, by anyone (not requested; the composable only needs `create`, `list`, the admin-only status update, and the admin-only delete below — deletion is in scope, editing still is not).
- Commenting on suggestions — not requested, no requirement covers it.
- Self-service admin-granting UI — admin status is granted manually via Supabase dashboard/SQL, not through the app.
- Audit trail of status changes, or notifying a suggestion's author when its status changes — not requested.
- Vote privacy from other signed-in users — see "Voting" below; only aggregate anonymity (no username attached to a vote) is in scope, not hiding that a given `user_id` voted a given way from someone querying the base table directly.

## Decisions

### `suggestions` table

| column         | type                          | notes                                                                 |
| -------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `id`           | uuid, PK                      |                                                                        |
| `user_id`      | uuid, FK → `auth.users.id`    | always recorded, regardless of `is_anonymous`                         |
| `title`        | text                          | required, non-empty, at most 100 characters (`check` constraints)     |
| `body`         | text                          | required, non-empty, at most 1000 characters (`check` constraints)    |
| `is_anonymous` | boolean, default `false`      | display-only flag — see "Anonymous display" below                     |
| `status`       | text, default `'new'`         | one of `new`/`rejected`/`confirmed`/`applied` (`check` constraint) — see "Admin identification" and the admin-only update policy below |
| `created_at`   | timestamptz, default `now()`  | used for ordering (most recent first) and pagination                  |

### RLS: authenticated-only read, owner-only insert, admin-only status update and deletion

Every existing user-data table's RLS is either fully public or "owner or public profile" (see `supabase-conventions`). Neither fits: the requirement is "any signed-in user can see the list," with no per-row privacy toggle. So this table introduces a new, simpler shape — gated on `authenticated` role rather than on a `profiles.is_public` check:

```sql
create policy "suggestions readable by authenticated users"
  on suggestions for select
  to authenticated
  using (true);

create policy "suggestions insertable by owner"
  on suggestions for insert
  to authenticated
  with check (user_id = auth.uid());
```

An UPDATE policy exists solely for the admin status change, gated on the admin JWT claim (see "Admin identification" below), and is paired with a column-level grant so that even an admin can only ever move `status` through this path — never rewrite `title`/`body`:

```sql
create policy "suggestions status updatable by admin"
  on suggestions for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke update on suggestions from authenticated;
grant update (status) on suggestions to authenticated;
```

`revoke`/`grant` and the RLS policy are both required: the policy alone would let any admin-authenticated `UPDATE` statement through regardless of which columns it targets, and the column grant alone says nothing about *whose* updates are allowed. Together, only a signed-in admin can issue an `UPDATE ... SET status = ...` on this table, and even they cannot touch `title`/`body`/`user_id`/`is_anonymous` through it.

A DELETE policy, admin-gated the same way, lets an admin remove a suggestion entirely (e.g. spam/trash):

```sql
create policy "suggestions deletable by admin"
  on suggestions for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

No column-level grant trick is needed here, unlike the status UPDATE — `DELETE` isn't column-scoped, so the `using` clause alone fully determines which rows an admin (and only an admin) can remove; a non-admin's `DELETE` matches zero rows, same as their blocked status `UPDATE`. `suggestion_votes.suggestion_id` already has `on delete cascade` (see "Voting" below), so a deleted suggestion's votes are cleaned up automatically — not a separate decision.

The page-level sign-in redirect and the admin-only rendering of the status/delete controls (see `suggestion-box` spec) are the primary UX gates; these policies are defense in depth at the DB layer, same reasoning as every other RLS policy in the schema.

**Alternative considered:** reuse the "owner or public profile" four-policy pattern. Rejected — that pattern's entire point is per-user privacy (`profiles.is_public`), which doesn't apply here; every suggestion is visible to every signed-in user regardless of whose profile it is.

### Anonymous display via a read view, not a client-side check

`user_id` is always stored (needed for RLS `insert` ownership and for any future moderation), but must never reach the client attached to an anonymous suggestion — a client-side "hide the username if anonymous" check would still leak `user_id` in the response, and `profiles` is public-readable, so a client could resolve it back to a username anyway. Instead, list reads go through a view that resolves the display name server-side and never selects `user_id`:

```sql
create view suggestions_with_author as
select
  s.id,
  s.title,
  s.body,
  s.is_anonymous,
  s.status,
  s.created_at,
  case when s.is_anonymous then null else p.username end as username
from suggestions s
left join profiles p on p.id = s.user_id;
```

Same "views inherit the querying user's RLS" pattern already used for `work_stats`/`adaptation_stats` (see `supabase-conventions`) — no `security definer`, so the view's own rows are still gated by the `suggestions` select policy above (authenticated only). The composable reads the list from this view, writes new suggestions directly to the base `suggestions` table (insert only, own `user_id`), and issues the admin status update directly against the base table too (the view is read-only usage here, not written through).

**Alternative considered:** return `user_id` and resolve/hide the username client-side. Rejected as the leak described above.

### Admin identification via JWT app_metadata role claim

An admin is identified by a `"role": "admin"` entry in `auth.users.raw_app_meta_data`, which Supabase includes in the session JWT's `app_metadata` and which `auth.jwt() -> 'app_metadata' ->> 'role'` reads directly inside an RLS policy — no extra table lookup needed to gate the UPDATE policy above. `app_metadata` (unlike `user_metadata`) can only be set by a service-role/admin call, never by the user themselves, so it can't be self-granted from the client. Granting admin is a manual, out-of-band operation (Supabase dashboard or a one-off SQL/script against `auth.users`) — there is deliberately no in-app UI for it (see Non-Goals).

On the client, the same claim is available from the current session's `app_metadata.role`, which the composable reads to decide whether to render the status control at all (see Non-Goals — this is a display gate; the RLS policy above is what actually enforces it).

**Alternative considered:** an `is_admin` boolean column on `profiles`. Rejected — it would need its own RLS-safe read path (a non-admin shouldn't necessarily be able to enumerate who's an admin) and a subquery in every admin-gated policy, where the JWT claim is already sitting on the request with no extra query.

### Pagination

Standard offset pagination (`.range()` in supabase-js) against `suggestions_with_author`, ordered by `created_at desc`. No cursor-based pagination — consistent with there being no other cursor-paginated list in this app, and suggestion volume isn't expected to be large enough to need it.

### Status filter defaults to "new", applied as a query-time `.eq()`

The filter is a plain `.eq('status', filterValue)` added to the same `suggestions_with_author` query when the filter isn't "all" — no new view or index needed; `status` is low-cardinality (4 values) over an expected-small table. Defaulting to `new` (rather than "all") is a product choice, not a security one: every status is already visible to every signed-in user per the `suggestions readable by authenticated users` policy, so the default only changes what's shown first, not what's reachable. Filter state lives client-side (page-local `ref`, not persisted), same as the page-number state it resets alongside.

### Voting: `suggestion_votes` table, broadly readable so aggregate scores stay correct

```sql
create table suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_id uuid not null references suggestions (id) on delete cascade,
  is_upvote boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, suggestion_id)
);

alter table suggestion_votes enable row level security;

create policy "suggestion_votes readable by authenticated users"
  on suggestion_votes for select
  to authenticated
  using (true);

create policy "suggestion_votes writable by owner"
  on suggestion_votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "suggestion_votes updatable by owner"
  on suggestion_votes for update
  to authenticated
  using (user_id = auth.uid());

create policy "suggestion_votes deletable by owner"
  on suggestion_votes for delete
  to authenticated
  using (user_id = auth.uid());
```

The unique constraint on `(user_id, suggestion_id)` is what enforces "at most one vote per user per suggestion" — the composable upserts on that same key, so casting a first vote inserts, changing direction updates, and undoing deletes (see "Conventions for composables" precedent elsewhere in this schema for the upsert-on-unique-key shape).

**Why SELECT is `to authenticated using (true)` rather than owner-only:** an aggregate score needs to reflect *everyone's* votes, not just the querying user's own. A `security_invoker` view (the pattern used everywhere else in this schema — see `work_stats`) runs with the querying user's own RLS, so if `suggestion_votes` were owner-only readable, every user's computed score would collapse to just their own vote (0 or ±1) instead of the real total — silently wrong, not a graceful degradation. This mirrors the `suggestions` table's own shape: it too is `to authenticated using (true)` at the base-table level, with anonymity achieved by which *columns* a view exposes (see "Anonymous display" above), not by hiding rows from other signed-in users. Individual vote rows are therefore visible to any signed-in user who queries the base table directly (not just the aggregate) — accepted here for the same reason it's accepted for `suggestions` itself: no requirement asks for that stronger guarantee, and the alternative (a `security definer` aggregation function) would be a new, heavier pattern introduced solely for this one feature. See Non-Goals.

**Alternative considered:** owner-only SELECT (matching `user_books`'s shape) plus a `security definer` function to compute the aggregate without inheriting RLS. Rejected for now as more machinery than this schema uses anywhere else, for a guarantee nothing has asked for; revisit if vote privacy ever becomes an actual requirement.

### Voting closes once a suggestion leaves "new"

The three write policies (insert/update/delete) each gain an `exists` subquery requiring the target suggestion's current `status` to be `'new'`:

```sql
create policy "suggestion_votes writable by owner"
  on suggestion_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );

create policy "suggestion_votes updatable by owner"
  on suggestion_votes for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );

create policy "suggestion_votes deletable by owner"
  on suggestion_votes for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );
```

This is a full lock on vote mutation for a triaged suggestion — not just blocking a first-time vote. A user who already voted thumbs-up on a suggestion that later moves to "confirmed" can no longer change that vote to thumbs-down, nor undo it; the row (and its contribution to the score) simply stays as it was at the moment status changed. This assumption wasn't spelled out in the request; the alternative (still allowing undo/change after triage) would let vote counts keep shifting on something already decided, which seems like the less useful behavior for the stated purpose ("help me select good suggestions") — once a decision is made, the tally that informed it is what should persist. The SELECT policy is untouched, so vote counts and a user's own past vote remain visible on a triaged suggestion (see "Suggestion Box page encourages checking..." — visibility was never status-gated, only mutation is).

The status check is duplicated across all three policies rather than factored into a shared function — Postgres RLS policies can call a function in their `using`/`with check` clause, but this schema doesn't use that pattern anywhere yet (see the repeated `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` clause across the status-update and delete policies above), so three inline copies stays consistent with the existing style rather than introducing a new one for this alone.

**Alternative considered:** enforce the "new"-only rule in the composable instead of RLS. Rejected — every other rule in this schema is enforced at the DB layer with the client-side check as a display-only convenience (see "Admin identification"), and this is no different: a client bug or a direct API call shouldn't be able to vote on a decided suggestion just because the UI forgot to check.

### `suggestions_with_author` extended with vote counts and the viewer's own vote

A later migration (`create or replace view`, adding columns rather than replacing the view wholesale) adds an aggregate join and a self-vote join:

```sql
create view suggestion_vote_counts
  with (security_invoker = true)
  as
  select
    s.id as suggestion_id,
    count(*) filter (where sv.is_upvote) as upvote_count,
    count(*) filter (where sv.is_upvote = false) as downvote_count,
    count(*) filter (where sv.is_upvote) - count(*) filter (where sv.is_upvote = false) as score
  from suggestions s
  left join suggestion_votes sv on sv.suggestion_id = s.id
  group by s.id;

create or replace view suggestions_with_author
  with (security_invoker = true)
  as
  select
    s.id, s.title, s.body, s.is_anonymous, s.status, s.created_at,
    case when s.is_anonymous then null else p.username end as username,
    coalesce(vc.upvote_count, 0) as upvote_count,
    coalesce(vc.downvote_count, 0) as downvote_count,
    coalesce(vc.score, 0) as score,
    mv.is_upvote as my_vote
  from suggestions s
  left join profiles p on p.id = s.user_id
  left join suggestion_vote_counts vc on vc.suggestion_id = s.id
  left join suggestion_votes mv on mv.suggestion_id = s.id and mv.user_id = auth.uid();
```

`my_vote` is `null` (no vote), `true` (upvoted), or `false` (downvoted) — the join filters to the querying user's own row via `auth.uid()`, so it's always at most one row per suggestion, no aggregation needed for that column. `suggestion_vote_counts` mirrors `work_stats`'s `count(*) filter (where ...)` shape (see `supabase-conventions`) and needs `security_invoker = true` explicitly for the same reason `suggestions_with_author` does (see its own note above) — Postgres views on this project default to running as their owner, not the querying role, unless told otherwise.

### Sorting: "Newest" (default) or "Most Popular" (`score desc`), both with a stable secondary key

`.order('created_at', { ascending: false })` for "Newest" (already the case); `.order('score', { ascending: false }).order('created_at', { ascending: false })` for "Most Popular" — the secondary `created_at` key breaks ties between equal-score suggestions consistently (newest first) rather than leaving their relative order unspecified. Sort state lives client-side, same as the status filter, and changing it resets to page 1 for the same reason changing the filter does.

### List item structure: `UCollapsible` per row instead of `UAccordion`'s built-in items

Discovered during the first implementation pass: Nuxt UI's `UAccordion` wraps each item's entire header row in a single `<button>` (its trigger), so an interactive control placed in that header — the admin status `USelect`, and now the vote buttons — would be invalid HTML nested-button markup. `UCollapsible` exposes its trigger via an `as-child`-style default slot instead: only the element passed to that slot becomes the actual trigger, so vote buttons and the admin control can sit as true siblings of a per-row `UCollapsible` (title/status badge/chevron inside the trigger, everything else outside it) rather than descendants of it. This is a component-structure decision with no requirement-level effect — the status badge was already specified as visible collapsed, and this change additionally makes vote buttons (required to be usable without expanding, since browsing-and-voting is the point) and the admin control available without expanding too.

### Homepage card: a new small component, not the existing catalog-link shape

The homepage already has a link-card component (`HomepageCatalogLinkCard`), but its shape is a large number plus a label — built specifically for "browse this catalog, here's how many items it has" (Works/Short Works/Adaptations). A Suggestion Box card has no natural count to show and needs a description instead, so reusing it would mean stuffing unrelated content into a component whose whole shape assumes a numeric count. A new component (icon, title, description, whole card a link — matching the visual language of `WorkSpotlight`'s header row and other sidebar cards' `bg-elevated` container) fits the narrower sidebar column it's placed in, alongside the existing spotlight/recommendation cards, rather than the full-width catalog row.

Placed in the sidebar directly after the stats card: both are general, non-personalized, non-content-specific cards, so grouping them keeps the content-specific spotlights (Book of the week, Book birthday, etc.) together as a block afterward.

## Risks / Trade-offs

- **[Risk]** A future feature (e.g. per-suggestion moderation or "my suggestions") needs `user_id` on the client. → The composable can add an owner-scoped query straight against the base `suggestions` table (`user_id = auth.uid()`, allowed by the same select policy) without touching the anonymous-safe view.
- **[Risk]** `is_anonymous` is a display flag, not a security boundary against the database owner/service role — anyone with direct DB or service-role access can always see who posted. → Acceptable; this is the same trust boundary every other "anonymous"-labeled feature in Supabase-backed apps accepts, and matches this app's existing threat model (RLS protects client access, not privileged access).
- **[Risk]** Granting admin requires manual dashboard/SQL access — there's no in-app recovery if the one person with dashboard access is unavailable. → Acceptable at this project's scale (a personal library app with a single operator); revisit only if multi-admin/self-service ever becomes a real need.
- **[Risk]** A user's JWT is cached client-side and only refreshed periodically/on re-auth, so a just-granted admin may not see the status control appear until their session token refreshes (sign-out/sign-in, or the client's normal token refresh cycle). → Acceptable, and consistent with how Supabase JWT claims generally propagate; worth a one-line note to whoever operates admin grants, not a product requirement.
- **[Risk]** `suggestion_votes` being broadly authenticated-readable means any signed-in user can query the base table directly and see exactly who voted which way on what, not just aggregate counts. → Accepted, matching the same trade-off already made for the `suggestions` table itself; revisit together if vote (or author) privacy from other signed-in users ever becomes an actual requirement, rather than solving it piecemeal for just one of the two tables.
- **[Risk]** Deletion is permanent — no soft-delete, no undo, no audit trail of what was deleted or by whom. → Accepted: this is the explicit point of the feature (removing spam/trash), a UI confirmation step guards against misclicks, and it's a single-admin, low-volume moderation action at this project's scale. Revisit only if multiple admins or a need to review past deletions becomes real.

## Migration Plan

New migration adds `suggestions` (with its constraints, the read/insert/admin-update policies, and the column-level grant) and `suggestions_with_author`. A later migration adds `suggestion_votes` (with its constraints and four RLS policies), the `suggestion_vote_counts` view, and extends `suggestions_with_author` (`create or replace view`) with the vote/score columns. A further migration adds the admin-only DELETE policy on `suggestions`. A final migration replaces the three `suggestion_votes` write policies with versions gated on the target suggestion's status being `'new'`. Per this project's release process (see CLAUDE.md - Release process), apply and verify locally first (`supabase migration up`), then push to hosted Supabase before merging to `main` — this change has no seed data, so no reseed step is needed. No rollback complexity: every piece here is additive and nothing else depends on it yet.
