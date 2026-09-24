-- Regroups dark_tower_journey_stats by coalesce(counts_with_id, id) so a
-- counts_with_id pair (see 20260922100200) - e.g. the two Gunslinger rows -
-- contributes one slot to `total`, not two, and a user who has read either
-- row in the pair is credited for that one slot. Both sides of the ratio
-- are grouped the same way, not just the total, so a user can never show
-- more "read" slots than the grouped total has (which raw per-row counting
-- would allow once a pair's rows can be read independently of each other).
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
  count(*) filter (where p.read_count > 0 and p.read_count < c.total) as on_the_way_count
from per_user_progress p
cross join core_total c;
