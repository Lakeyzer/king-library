-- Aggregate per-work reading stats, computed live from user_books rather than
-- stored counters. No security definer: runs with the querying role's own
-- permissions, so counts only ever reflect user_books rows that role can see
-- under RLS (their own rows, plus rows belonging to public profiles).
create view work_stats as
select
  k.id as king_work_id,
  count(*) filter (where ub.want_to_read) as want_to_read_count,
  count(*) filter (where ub.currently_reading) as currently_reading_count,
  count(*) filter (where ub.read) as read_count,
  count(*) filter (where ub.owned) as owner_count,
  count(*) filter (where ub.owned and ub.read) as owners_who_read_count,
  case
    when count(*) filter (where ub.owned) > 0
    then count(*) filter (where ub.owned and ub.read)::numeric / count(*) filter (where ub.owned)
    else null
  end as read_through_rate
from king_works k
left join user_books ub on ub.king_work_id = k.id
group by k.id;

grant select on work_stats to anon, authenticated;
