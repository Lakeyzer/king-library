-- By Other Hands works have no reread-history table (see
-- add-by-other-hands's design.md Non-Goals - no user_related_work_reads
-- mirroring user_book_reads), but marking one read still collects an
-- optional note, rating, and format, the same fields King's mark-read flow
-- collects - they just describe the current/most-recent read, overwritten
-- on a later reread rather than logged per-instance. Unlike King, where
-- format is split across two columns (user_books.format for the
-- in-progress session, user_book_reads.format for each logged read - see
-- 20260916120320_add_format_to_user_books.sql), this one column serves both
-- roles here, same as started_on/note/rating already do on this table.
alter table user_related_works
  add column note text check (char_length(note) <= 200),
  add column rating integer check (rating between 1 and 5),
  add column format text check (format is null or format in ('physical', 'audiobook', 'ebook'));
