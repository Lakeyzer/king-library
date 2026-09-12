-- Resolves the open product decision in supabase-conventions
-- ("cascade_short_story_reads_on_collection_read") in favor of un-cascading:
-- un-marking a collection as read now also un-marks the short stories that
-- were only marked read *because of* that collection.
--
-- To do that safely we first need to know *why* a user_short_story_reads row
-- exists - a story a user read and checked off individually must never be
-- deleted just because some collection containing it was later unmarked.
-- via_collection_id records which collection's cascade (if any) created the
-- row; null means the user marked that story read directly.
alter table user_short_story_reads
  add column via_collection_id uuid references king_works (id) on delete set null;

-- Recreated to also stamp via_collection_id - on conflict still does
-- nothing, so a pre-existing row (whatever its provenance) is never
-- overwritten by a later collection's cascade.
create or replace function cascade_short_story_reads_on_collection_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'collection') then
      insert into user_short_story_reads (user_id, short_story_id, via_collection_id)
      select new.user_id, ksc.short_story_id, new.king_work_id
      from king_short_story_collections ksc
      where ksc.king_work_id = new.king_work_id
      on conflict (user_id, short_story_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

-- Un-marking a collection deletes only the reads that collection's cascade
-- created (via_collection_id = old.king_work_id) - never a story the user
-- read on its own, and never a story still justified by another collection
-- containing it that's still marked read (a story can appear in more than
-- one collection, per king_short_story_collections).
create function uncascade_short_story_reads_on_collection_unread()
returns trigger
language plpgsql
as $$
begin
  if old.read = true and new.read = false then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'collection') then
      delete from user_short_story_reads r
      using king_short_story_collections ksc
      where r.short_story_id = ksc.short_story_id
        and ksc.king_work_id = old.king_work_id
        and r.user_id = new.user_id
        and r.via_collection_id = old.king_work_id
        and not exists (
          select 1
          from king_short_story_collections other_ksc
          join user_books other_ub
            on other_ub.king_work_id = other_ksc.king_work_id
            and other_ub.user_id = new.user_id
            and other_ub.read = true
          where other_ksc.short_story_id = r.short_story_id
            and other_ksc.king_work_id <> old.king_work_id
        );
    end if;
  end if;
  return new;
end;
$$;

create trigger user_books_uncascade_short_story_reads
  after update on user_books
  for each row
  execute function uncascade_short_story_reads_on_collection_unread();
