-- Aggregate per-work stats for By Other Hands works, mirroring work_stats
-- one domain over - see supabase-conventions "Statistics: query live, don't
-- store counters". Scoped entirely to related_works/user_related_works, so
-- this is additional By-Other-Hands-only stats surface, not a King stat -
-- it never joins king_works/user_books and nothing King-side ever queries it.
create view related_work_stats as
select
  r.id as related_work_id,
  count(*) filter (where urw.want_to_read) as want_to_read_count,
  count(*) filter (where urw.currently_reading) as currently_reading_count,
  count(*) filter (where urw.read) as read_count,
  count(*) filter (where urw.owned) as owner_count
from related_works r
left join user_related_works urw on urw.related_work_id = r.id
group by r.id;

grant select on related_work_stats to anon, authenticated;
