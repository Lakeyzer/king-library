-- Copy details: what kind of copy a collector owns (format, edition,
-- printing, signed). Stored on user_book_editions for an edition tile and on
-- user_books for an edition-less owned work, under the same copy_ names so
-- one shape serves both. The copy_ prefix keeps them apart from
-- user_books.format, which is the current reading session's format, not the
-- owned copy's. See the add-bookshelf-copy-details change's design.md.

-- ---------------------------------------------------------------------------
-- user_book_editions
-- ---------------------------------------------------------------------------

alter table user_book_editions
  add column copy_format text,
  add column copy_edition int,
  add column copy_printing int,
  add column copy_signed boolean not null default false;

alter table user_book_editions
  add constraint user_book_editions_copy_format_valid
    check (copy_format is null or copy_format in ('paperback', 'hardcover', 'audiobook', 'ebook')),
  add constraint user_book_editions_copy_edition_valid
    check (copy_edition is null or copy_edition >= 1),
  add constraint user_book_editions_copy_printing_valid
    check (copy_printing is null or copy_printing >= 1),
  -- Edition, printing and signed only describe a physical copy.
  add constraint user_book_editions_copy_physical_only
    check (
      copy_format in ('paperback', 'hardcover')
      or (copy_edition is null and copy_printing is null and not copy_signed)
    );

-- ---------------------------------------------------------------------------
-- user_books
-- ---------------------------------------------------------------------------

-- Only meaningful while the work has no user_book_editions rows - once an
-- edition is picked, the edition row's own copy details are what the shelf
-- shows.
alter table user_books
  add column copy_format text,
  add column copy_edition int,
  add column copy_printing int,
  add column copy_signed boolean not null default false;

alter table user_books
  add constraint user_books_copy_format_valid
    check (copy_format is null or copy_format in ('paperback', 'hardcover', 'audiobook', 'ebook')),
  add constraint user_books_copy_edition_valid
    check (copy_edition is null or copy_edition >= 1),
  add constraint user_books_copy_printing_valid
    check (copy_printing is null or copy_printing >= 1),
  add constraint user_books_copy_physical_only
    check (
      copy_format in ('paperback', 'hardcover')
      or (copy_edition is null and copy_printing is null and not copy_signed)
    );

-- Un-owning a work clears its edition-less copy details, so they don't
-- resurface if the work is marked owned again. A trigger rather than
-- composable logic so every un-own path (shelf remove, the "On my shelf"
-- checkbox, removing the last edition) is covered.
create function clear_copy_details_on_unowned()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.owned = true and new.owned = false then
    new.copy_format := null;
    new.copy_edition := null;
    new.copy_printing := null;
    new.copy_signed := false;
  end if;
  return new;
end;
$$;

create trigger user_books_clear_copy_details_on_unowned
  before update on user_books
  for each row
  execute function clear_copy_details_on_unowned();
