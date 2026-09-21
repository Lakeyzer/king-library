create view dark_tower_journey_stats as
with per_user_progress as (
  select
    ub.user_id,
    count(*) filter (where ub.read) as read_count
  from user_books ub
  join king_works k on k.id = ub.king_work_id
  where k.dark_tower = true
  group by ub.user_id
),
core_total as (
  select count(*) as total from king_works where dark_tower = true
)
select
  count(*) filter (where p.read_count = c.total) as finished_count,
  count(*) filter (where p.read_count > 0 and p.read_count < c.total) as on_the_way_count
from per_user_progress p
cross join core_total c;
