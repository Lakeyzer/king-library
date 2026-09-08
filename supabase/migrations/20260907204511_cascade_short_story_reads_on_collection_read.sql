-- When a user_books row for a work of type 'collection' is marked read,
-- inserts a user_short_story_reads row for every short story linked to that
-- collection via king_short_story_collections. An `after` trigger, not
-- `before` - it writes to a different table as a side effect rather than
-- modifying the row being saved. See supabase-conventions
-- "cascade_short_story_reads_on_collection_read()".
--
-- Note the tg_op comparison uses 'INSERT' (uppercase) - TG_OP is always
-- upper-case ('INSERT'/'UPDATE'/'DELETE'). A lower-case comparison would
-- never match on insert, and since OR only short-circuits once the left
-- operand is true, postgres would then evaluate `old.read` on a plain
-- insert-with-read-true (the "mark as read directly" flow, with no prior
-- want-to-read/currently-reading row) - and OLD isn't assigned on an
-- insert-triggered call, so that would raise "record old is not assigned
-- yet" at runtime.
create function cascade_short_story_reads_on_collection_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'collection') then
      insert into user_short_story_reads (user_id, short_story_id)
      select new.user_id, ksc.short_story_id
      from king_short_story_collections ksc
      where ksc.king_work_id = new.king_work_id
      on conflict (user_id, short_story_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger user_books_cascade_short_story_reads
  after insert or update on user_books
  for each row
  execute function cascade_short_story_reads_on_collection_read();
