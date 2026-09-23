-- Adds a third bucket to dark_tower_journey_stats: visitors who haven't
-- read any core Dark Tower book yet, for the "haven't read anything DT
-- yet" newcomer stat on the Dark Tower page. finished_count and
-- on_the_way_count already partition every user with read_count > 0 (see
-- 20260922100300); not_started_count is everyone else in the same
-- RLS-visible population, computed the same way - "visible" mirrors
-- exactly the user_books rows per_user_progress can see (owner or public
-- profile), not a raw profiles total, so a private profile who has
-- actually made progress is never miscounted as not-started just because
-- their user_books rows are invisible to this visitor.
create or replace view dark_tower_journey_stats as
with per_user_progress as (
  select
    ub.user_id,
    count(distinct coalesce(k.counts_with_id, k.id)) filter (where ub.read) as read_count
  from user_books ub
  join king_works k on k.id = ub.king_work_id
  where k.dark_tower = true
  group by ub.user_id
),
core_total as (
  select count(distinct coalesce(counts_with_id, id)) as total
  from king_works
  where dark_tower = true
)
select
  count(*) filter (where p.read_count = c.total) as finished_count,
  count(*) filter (where p.read_count > 0 and p.read_count < c.total) as on_the_way_count,
  greatest(
    (select count(*) from profiles where is_public = true or id = auth.uid())
    - count(*) filter (where p.read_count > 0),
    0
  ) as not_started_count
from per_user_progress p
cross join core_total c;
