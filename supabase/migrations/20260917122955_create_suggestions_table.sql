-- User-submitted feedback/feature ideas, browsable by any signed-in user (no
-- per-row privacy toggle, unlike every other user-data table - see the
-- suggestion-box change's design.md "RLS: authenticated-only read,
-- owner-only insert, admin-only status update"). user_id is always recorded,
-- even when is_anonymous hides it from display, so it can back an admin-only
-- status workflow later without a schema change.
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  is_anonymous boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint suggestions_title_not_blank check (char_length(btrim(title)) > 0),
  constraint suggestions_body_not_blank check (char_length(btrim(body)) > 0),
  constraint suggestions_status_valid check (status in ('new', 'rejected', 'confirmed', 'applied'))
);

alter table suggestions enable row level security;

create policy "suggestions readable by authenticated users"
  on suggestions for select
  to authenticated
  using (true);

create policy "suggestions insertable by owner"
  on suggestions for insert
  to authenticated
  with check (user_id = auth.uid());

-- Admin-only status update. Supabase grants full table privileges to
-- `authenticated` by default (RLS is the intended gate), so the RLS policy
-- alone would let an admin's UPDATE touch title/body/user_id/is_anonymous
-- too - the revoke/grant pair below narrows the actual column-level
-- privilege to `status`, so even an admin can only ever move that column
-- through this policy. See design.md "RLS: authenticated-only read,
-- owner-only insert, admin-only status update".
create policy "suggestions status updatable by admin"
  on suggestions for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke update on suggestions from authenticated;
grant update (status) on suggestions to authenticated;

-- Resolves the display name server-side and never selects user_id, so an
-- anonymous suggestion's author never reaches the client - see design.md
-- "Anonymous display via a read view, not a client-side check".
-- security_invoker = true is required, not the default: without it the view
-- runs as its owner (bypassing RLS) rather than the querying user, the same
-- bug fixed for work_stats/adaptation_stats in
-- 20260909074627_fix_stats_views_security_invoker.sql.
create view suggestions_with_author
  with (security_invoker = true)
  as
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
