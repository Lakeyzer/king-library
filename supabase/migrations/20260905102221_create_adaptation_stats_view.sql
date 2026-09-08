-- Same shape as work_stats, one table over: want-to-watch/watched counts,
-- computed live from user_adaptations. No security definer, so counts only
-- ever reflect rows visible to the querying role under user_adaptations' RLS.
create view adaptation_stats as
select
  a.id as adaptation_id,
  count(*) filter (where ua.want_to_watch) as want_to_watch_count,
  count(*) filter (where ua.watched) as watched_count
from adaptations a
left join user_adaptations ua on ua.adaptation_id = a.id
group by a.id;

grant select on adaptation_stats to anon, authenticated;
