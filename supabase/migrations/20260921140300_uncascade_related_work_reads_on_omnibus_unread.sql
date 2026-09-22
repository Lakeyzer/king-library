-- Mirrors uncascade_book_reads_on_omnibus_unread() one join shape over: when
-- a user_related_works row for an is_omnibus related_work transitions read
-- true -> false, un-marks the component related_works that *this omnibus's*
-- cascade marked read (via_omnibus_id = old.related_work_id) - never one the
-- user read on their own (via_omnibus_id is null there), and never one still
-- justified by another omnibus containing it that's still marked read.
create function uncascade_related_work_reads_on_omnibus_unread()
returns trigger
language plpgsql
as $$
begin
  if old.read = true and new.read = false then
    if exists (select 1 from related_works where id = new.related_work_id and is_omnibus = true) then
      update user_related_works urw
      set read = false,
          via_omnibus_id = null
      from related_work_omnibus_works rwo
      where rwo.omnibus_related_work_id = old.related_work_id
        and rwo.component_related_work_id = urw.related_work_id
        and urw.user_id = new.user_id
        and urw.via_omnibus_id = old.related_work_id
        and not exists (
          select 1
          from related_work_omnibus_works other_rwo
          join user_related_works other_urw
            on other_urw.related_work_id = other_rwo.omnibus_related_work_id
            and other_urw.user_id = new.user_id
            and other_urw.read = true
          where other_rwo.component_related_work_id = urw.related_work_id
            and other_rwo.omnibus_related_work_id <> old.related_work_id
        );
    end if;
  end if;
  return new;
end;
$$;

create trigger user_related_works_uncascade_omnibus_reads
  after update on user_related_works
  for each row
  execute function uncascade_related_work_reads_on_omnibus_unread();
