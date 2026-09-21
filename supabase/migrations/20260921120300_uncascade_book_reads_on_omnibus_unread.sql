-- Mirror of uncascade_short_story_reads_on_collection_unread(), one join
-- shape over: when a user_books row for a work of type 'omnibus'
-- transitions read true -> false, un-marks the component books that *this
-- omnibus's* cascade marked read (via_omnibus_id = old.king_work_id) -
-- never a book the user read on its own (via_omnibus_id is null there), and
-- never one still justified by another omnibus containing it that's still
-- marked read (a novel could in principle appear in more than one omnibus
-- edition).
create function uncascade_book_reads_on_omnibus_unread()
returns trigger
language plpgsql
as $$
begin
  if old.read = true and new.read = false then
    if exists (select 1 from king_works where id = new.king_work_id and type = 'omnibus') then
      update user_books ub
      set read = false,
          via_omnibus_id = null
      from king_work_omnibus_works kow
      where kow.omnibus_king_work_id = old.king_work_id
        and kow.component_king_work_id = ub.king_work_id
        and ub.user_id = new.user_id
        and ub.via_omnibus_id = old.king_work_id
        and not exists (
          select 1
          from king_work_omnibus_works other_kow
          join user_books other_ub
            on other_ub.king_work_id = other_kow.omnibus_king_work_id
            and other_ub.user_id = new.user_id
            and other_ub.read = true
          where other_kow.component_king_work_id = ub.king_work_id
            and other_kow.omnibus_king_work_id <> old.king_work_id
        );
    end if;
  end if;
  return new;
end;
$$;

create trigger user_books_uncascade_omnibus_reads
  after update on user_books
  for each row
  execute function uncascade_book_reads_on_omnibus_unread();
