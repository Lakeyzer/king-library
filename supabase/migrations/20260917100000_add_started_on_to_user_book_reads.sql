-- Each logged read only ever remembered read_on (its finish date) - the
-- start date typed into the mark-read/read-again date range was only ever
-- persisted to user_books' current-cycle summary, so it disappeared once a
-- read stopped being the most recent one. Adding started_on here lets the
-- reading timeline's edit affordance offer a real date range again, per
-- entry, matching the range already offered when logging a read.
alter table user_book_reads add column started_on date;
