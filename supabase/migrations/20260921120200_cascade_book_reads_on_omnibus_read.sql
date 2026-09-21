-- When a user_books row for a work of type 'omnibus' is marked read, marks
-- every component king_work linked via king_work_omnibus_works as read too
-- (e.g. reading "The Bachman Books" marks Rage, The Long Walk, Roadwork, and
-- The Running Man read). An `after` trigger, not `before` - it writes to
-- other rows in this same table as a side effect rather than modifying the
-- row being saved. Mirrors cascade_short_story_reads_on_collection_read(),
-- one join shape over - see supabase-conventions
-- "cascade_book_reads_on_omnibus_read()".
--
-- Same TG_OP gotcha as the short-story cascade: TG_OP is always upper-case
-- ('INSERT'/'UPDATE'/'DELETE'), and OLD isn't assigned on an insert, so the
-- `tg_op = 'INSERT'` check must short-circuit before `old.read` is
-- evaluated - a lower-case comparison would never match on insert and then
-- raise "record old is not assigned yet" on a plain insert-with-read-true.
create function cascade_book_reads_on_omnibus_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'omnibus') then
      -- The where clause on the conflict update means an already-read
      -- component book (whether read directly or via a different omnibus)
      -- is left completely untouched - its via_omnibus_id, started_on,
      -- finished_on, and read_year are never overwritten by this cascade.
      insert into user_books (user_id, king_work_id, read, via_omnibus_id)
      select new.user_id, kow.component_king_work_id, true, new.king_work_id
      from king_work_omnibus_works kow
      where kow.omnibus_king_work_id = new.king_work_id
      on conflict (user_id, king_work_id) do update
        set read = true,
            via_omnibus_id = excluded.via_omnibus_id
        where user_books.read = false;
    end if;
  end if;
  return new;
end;
$$;

create trigger user_books_cascade_omnibus_reads
  after insert or update on user_books
  for each row
  execute function cascade_book_reads_on_omnibus_read();
