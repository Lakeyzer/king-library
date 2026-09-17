-- user_book_reads didn't exist before the previous migration, so every
-- work a user had already marked read has no logged-read row yet - without
-- this, the reading timeline (which now sources from user_book_reads
-- instead of user_books) would go blank for existing read history. Backfill
-- one row per already-read user_books row from its current
-- started_on/finished_on/read_year - coalescing finished_on to started_on
-- for read_on matches fetchReadingTimeline()'s existing "readOn" fallback
-- (finished_on ?? started_on), so a backfilled row sorts/displays the same
-- as it did before this migration. note/format/rating are left null since
-- that detail was never captured before this feature existed.
insert into user_book_reads (user_id, king_work_id, read_on, read_year)
select user_id, king_work_id, coalesce(finished_on, started_on), read_year
from user_books
where read = true;
