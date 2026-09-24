-- Mirrors cascade_book_reads_on_omnibus_read() one join shape over: when a
-- user_related_works row for an is_omnibus related_work is marked read,
-- marks every component related_work linked via related_work_omnibus_works
-- as read too (e.g. reading "Beginnings" marks Gunslinger Born, Long Road
-- Home, Treachery, Fall of Gilead, and Battle of Jericho Hill read). See
-- supabase-conventions "cascade_book_reads_on_omnibus_read()" for the
-- TG_OP/OLD gotcha this same shape avoids.
create function cascade_related_work_reads_on_omnibus_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from related_works where id = new.related_work_id and is_omnibus = true) then
      insert into user_related_works (user_id, related_work_id, read, via_omnibus_id)
      select new.user_id, rwo.component_related_work_id, true, new.related_work_id
      from related_work_omnibus_works rwo
      where rwo.omnibus_related_work_id = new.related_work_id
      on conflict (user_id, related_work_id) do update
        set read = true,
            via_omnibus_id = excluded.via_omnibus_id
        where user_related_works.read = false;
    end if;
  end if;
  return new;
end;
$$;

create trigger user_related_works_cascade_omnibus_reads
  after insert or update on user_related_works
  for each row
  execute function cascade_related_work_reads_on_omnibus_read();
