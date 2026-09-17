-- Captured when a user starts reading (see reading-status "User can start
-- reading a work with a start date"), so the Currently Reading card can show
-- which format a work is being read in without waiting for a logged read to
-- exist. Distinct from user_book_reads.format (the format of a completed
-- read) - this column only ever reflects the *current* reading session;
-- startReading() writes it, and it's never read from once currently_reading
-- goes back to false.
alter table user_books add column format text;

alter table user_books add constraint user_books_format_valid
  check (format is null or format in ('physical', 'audiobook', 'ebook'));
