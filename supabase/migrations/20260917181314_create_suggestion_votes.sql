-- One row per (user, suggestion) vote - the unique constraint is what
-- enforces "at most one vote per user per suggestion." The composable
-- upserts on that same key: casting a first vote inserts, changing
-- direction updates, undoing deletes.
create table suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_id uuid not null references suggestions (id) on delete cascade,
  is_upvote boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, suggestion_id)
);

alter table suggestion_votes enable row level security;

-- Broadly readable, like `suggestions` itself - not owner-only. A
-- security_invoker aggregate view needs to see every user's vote to
-- compute a correct score; if this were owner-only, every viewer's
-- computed score would silently collapse to just their own vote. See
-- design.md "Voting: suggestion_votes table, broadly readable so
-- aggregate scores stay correct".
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

-- Same count(*) filter (where ...) shape as work_stats/adaptation_stats.
-- security_invoker = true is required (not the default) for the same
-- reason as suggestions_with_author - see that view's own note.
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

-- Adds vote/score columns to the existing view rather than replacing it -
-- create or replace view can append columns without disturbing the ones
-- already relied on. my_vote is null/true/false: the join is filtered to
-- the querying user's own row via auth.uid(), so it's at most one row per
-- suggestion with no aggregation needed for that column.
create or replace view suggestions_with_author
  with (security_invoker = true)
  as
  select
    s.id,
    s.title,
    s.body,
    s.is_anonymous,
    s.status,
    s.created_at,
    case when s.is_anonymous then null else p.username end as username,
    coalesce(vc.upvote_count, 0) as upvote_count,
    coalesce(vc.downvote_count, 0) as downvote_count,
    coalesce(vc.score, 0) as score,
    mv.is_upvote as my_vote
  from suggestions s
  left join profiles p on p.id = s.user_id
  left join suggestion_vote_counts vc on vc.suggestion_id = s.id
  left join suggestion_votes mv on mv.suggestion_id = s.id and mv.user_id = auth.uid();
