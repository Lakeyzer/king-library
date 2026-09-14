-- Lets a curator take a work or adaptation out of circulation everywhere it's
-- surfaced without deleting the row (which would break user_books/
-- user_adaptations history and foreign-key links). Defaults to true so every
-- existing row keeps its current behavior until explicitly deactivated.
alter table king_works add column active boolean not null default true;
alter table adaptations add column active boolean not null default true;
