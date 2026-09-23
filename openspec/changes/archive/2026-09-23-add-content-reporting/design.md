## Context

Four content domains each have their own canonical table (`king_works`, `king_short_stories`, `adaptations`, `related_works` - see `supabase-conventions`) and their own pair of pages (overview + detail). This change adds one small, generic capability - "let a signed-in user submit a report" - that has to hook into all eight pages without becoming eight separate features. See `proposal.md` - Why/What Changes for motivation and scope; see `specs/content-reporting/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**
- One schema and one composable that both report flows (issue + missing-content) share.
- Correctly attribute an issue report to exactly one item, across four differently-shaped source tables, without a polymorphic association.
- Keep the write path simple enough that no DB trigger is needed to enforce its invariants.

**Non-Goals:**
- No rate limiting or spam protection beyond "must be signed in" - acceptable for the current userbase size; revisit if abuse shows up in practice.
- No email/notification on submission - reports are pulled, not pushed, for now.
- No per-report anonymous/named toggle like `suggestions` - a report is always shown anonymously on the public list (see "RLS" below), so there's no per-submission choice to make.

## Decisions

### One `reports` table, four nullable item-reference columns, not a polymorphic (`item_type`, `item_id`) pair

`supabase-conventions` already establishes a preference for explicit typed FKs over polymorphic associations elsewhere in this schema (`adaptation_works` / `adaptation_short_stories` instead of a single join table with a `source_type` discriminator) - the same reasoning applies here. A report references at most one of four possible tables, so `reports` gets one nullable FK per table:

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('issue', 'missing_content')),
  content_area text not null check (content_area in ('works', 'short_works', 'adaptations', 'works_by_others')),
  king_work_id uuid references king_works(id) on delete set null,
  short_story_id uuid references king_short_stories(id) on delete set null,
  adaptation_id uuid references adaptations(id) on delete set null,
  related_work_id uuid references related_works(id) on delete set null,
  description text not null check (char_length(description) <= 500 and char_length(description) > 0),
  created_at timestamptz not null default now(),
  constraint reports_item_reference_matches_type check (
    (type = 'missing_content' and king_work_id is null and short_story_id is null and adaptation_id is null and related_work_id is null)
    or (type = 'issue' and (
      (king_work_id is not null)::int + (short_story_id is not null)::int
      + (adaptation_id is not null)::int + (related_work_id is not null)::int = 1
    ))
  )
);
```

`content_area` is set on every report, including `issue` reports where it's technically derivable from which FK is populated - storing it directly makes every report groupable/filterable by content domain with a plain `where content_area = ...`, without a curator needing to know which FK column corresponds to which page. The check constraint above still enforces that exactly one item FK is set for `issue` and none for `missing_content`, so the two never drift.

**Alternative considered:** a single nullable `item_id uuid` plus `item_type text`. Rejected for the same reason the existing schema avoids it - it can't be validated with a foreign key at all (Postgres FKs target one table), pushing referential integrity entirely into application code. The four-column approach costs a slightly wider table for real FK enforcement.

### RLS: owner-only insert, authenticated-read, admin-only status update

Reports started as an owner-only-read, insert-only table (no status, no public list) but were extended, in the same change, to a browsable-and-triageable queue on the Suggestion Box page - matching `suggestions`' own shape almost exactly. The final RLS mirrors `suggestions`' pattern (see `create_suggestions_table.sql`) rather than reinventing one:

```sql
alter table reports enable row level security;

create policy "reports insertable by owner"
  on reports for insert
  with check (user_id = auth.uid());

create policy "reports readable by authenticated users"
  on reports for select
  to authenticated
  using (true);

create policy "reports status updatable by admin"
  on reports for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke update on reports from authenticated;
grant update (status) on reports to authenticated;
```

The `revoke`/`grant (status)` pair is the same defense used for `suggestions` - RLS alone would let an admin's UPDATE touch any column (Supabase grants full table privileges to `authenticated` by default), so the column-level grant narrows what an UPDATE can actually change to `status`, even for an admin.

Unlike `suggestions_with_author` (which conditionally nulls out `username` per-row based on an `is_anonymous` flag), reports have no such flag - every report is always anonymous, so `reports_public` never joins `profiles` and never selects `user_id` at all:

```sql
create view reports_public
  with (security_invoker = true)
  as
  select
    r.id, r.type, r.content_area, r.description, r.status, r.created_at,
    coalesce(kw.title, ss.title, a.title, rw.title) as item_title,
    coalesce(kw.slug, ss.slug, a.slug, rw.slug) as item_slug
  from reports r
  left join king_works kw on kw.id = r.king_work_id
  left join king_short_stories ss on ss.id = r.short_story_id
  left join adaptations a on a.id = r.adaptation_id
  left join related_works rw on rw.id = r.related_work_id;
```

`security_invoker = true` is required (not the default) so the view runs as the querying user, subject to the `reports readable by authenticated users` policy above - the same fix already applied to `work_stats`/`adaptation_stats`/`suggestions_with_author`. The four `left join`s are mutually exclusive per report (`reports_item_reference_matches_type` guarantees at most one item FK is set), so `coalesce` always resolves to the right table without a `case`/`content_area` branch.

No update policy beyond the admin-only status one - a report's own content (type/content_area/item/description) is immutable from the client's side once submitted. Deletion is admin-only too, added the same way `suggestions` gained one (`add_suggestions_delete_policy.sql`):

```sql
create policy "reports deletable by admin"
  on reports for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

Unlike the status UPDATE policy, DELETE isn't column-scoped, so no `revoke`/`grant` pair is needed - the `using` clause alone gates which rows an admin (and only an admin) can remove. Nothing references `reports.id` via foreign key, so there's nothing else to cascade.

### One composable, `useReports()`, with two thin wrapper functions

`reportIssue({ contentArea, itemId, description })` and `reportMissingContent({ contentArea, description })` both funnel into one internal insert, setting `type` and the matching item FK column based on `contentArea`. This keeps the "exactly one FK for an issue report" invariant enforced in one place in application code (mirroring how `clear_wishlist_on_owned`-style invariants are sometimes left to the composable rather than a trigger, e.g. the edition-removal ownership-clearing logic in `supabase-conventions`) rather than duplicated across four call sites, one per page domain.

### Sign-in gating reuses the existing auth pattern

Same shape as `suggestion-box`'s "Only signed-in users can create a suggestion" requirement: the control is always rendered, but activating it while signed out routes to sign-in instead of opening the form. No new auth primitive needed.

### Reports section reuses the Suggestion Box page and its `isAdmin` check

The Reports section lives on `suggestion-box.vue` rather than a new route - the page already requires sign-in (per its own existing requirement) and already computes `isAdmin` via `useSuggestions()`. `useReports()` exposes its own identical `isAdmin` (same `app_metadata.role === 'admin'` check, mirroring `useSuggestions()`'s own comment on why this is a display-only gate - the RLS policy is what actually enforces it) so the composable stays self-contained, but the page itself only reads one of the two - they're redundant copies of the same computed check, not two different admin concepts.

### Status values: `new` / `rejected` / `applied` - no `confirmed`

Reports skip `suggestions`' fourth status (`confirmed`) - a report is either acted on (`applied`) or not (`rejected`), with no separate "acknowledged but not yet applied" middle state the way a suggestion can be. Fewer states here is a deliberate simplification, not an oversight; if a "confirmed, working on it" state is ever needed, it's an additive `check` constraint change, not a redesign.

## Risks / Trade-offs

- **No spam protection** → acceptable at current scale; if abuse appears, add a simple per-user rate limit (e.g. N reports per hour) as a follow-up, not blocking this change.
- **`content_area` and the item FK could theoretically be set inconsistently** (e.g. `content_area = 'adaptations'` with `king_work_id` set) since the check constraint validates FK-count-per-type but not FK-matches-`content_area`. Mitigation: the composable is the only write path (per "Core rule: queries only via composables") and always derives both from the same `contentArea` input in one call, so this can't happen through normal use; a stricter check constraint could enforce it fully but adds complexity for a case the single write path already rules out.
- **A deleted item leaves an `issue` report with a null title/slug** (`on delete set null` on all four item FKs) - the report still shows in the list (type/content_area/description/status intact) but with no link. Acceptable: the underlying content being removed is rare, and the report's text still carries the context.

## Migration Plan

Two additive migrations, no existing table's data touched:
1. `create_reports_table` - the `reports` table itself, owner-only insert, owner-only read (superseded by migration 2 below).
2. `add_reports_status_and_public_view` - adds `status`, replaces the owner-only read policy with the authenticated-read/admin-status-update pair above, and adds `reports_public`.

Both follow `supabase-conventions`'s local-development workflow (apply locally with `migration up`, verify, then push to hosted before merge per the project's release process). No seed data, no backfill.
