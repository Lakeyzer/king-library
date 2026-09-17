-- The previous migration (20260916091551) backfilled user_book_reads rows
-- from user_books before started_on existed on this table, so those rows
-- (and any created since via markRead/finishReading/readAgain, before this
-- release) have started_on = null. user_books itself was never touched by
-- any reread-tracking migration, so the start date for each work's *most
-- recent* logged read is still sitting there and can be recovered.
--
-- Only the most recent read per (user_id, king_work_id) is recoverable -
-- user_books has only ever held one reading cycle's dates, so an earlier
-- reread's start date was already overwritten before this feature existed,
-- with nothing left anywhere to pull it back from for that older entry.
with most_recent_read as (
  select distinct on (ubr.user_id, ubr.king_work_id)
    ubr.id,
    ub.started_on
  from user_book_reads ubr
  join user_books ub
    on ub.user_id = ubr.user_id
   and ub.king_work_id = ubr.king_work_id
   and ub.read = true
  order by
    ubr.user_id,
    ubr.king_work_id,
    coalesce(ubr.read_on, (ubr.read_year || '-01-01')::date) desc nulls last,
    ubr.created_at desc
)
update user_book_reads ubr
set started_on = most_recent_read.started_on
from most_recent_read
where ubr.id = most_recent_read.id
  and most_recent_read.started_on is not null;
