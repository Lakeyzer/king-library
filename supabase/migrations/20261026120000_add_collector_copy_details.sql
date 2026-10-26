-- Collector copy details on top of format/edition/printing/signed: dust
-- jacket and book club edition (hardcover only), and limited edition with an
-- optional copy number and edition size (any physical copy). Same columns on
-- user_book_editions and user_books, as with the rest of copy_* - see the
-- add-bookshelf-copy-details change's design.md.

-- ---------------------------------------------------------------------------
-- user_book_editions
-- ---------------------------------------------------------------------------

alter table user_book_editions
  add column copy_dust_jacket boolean not null default false,
  add column copy_book_club boolean not null default false,
  add column copy_limited boolean not null default false,
  add column copy_limited_number text,
  add column copy_limited_size int;

alter table user_book_editions
  drop constraint user_book_editions_copy_physical_only,
  -- Edition, printing, signed and limited only describe a physical copy.
  add constraint user_book_editions_copy_physical_only
    check (
      copy_format in ('paperback', 'hardcover')
      or (copy_edition is null and copy_printing is null and not copy_signed and not copy_limited)
    ),
  -- A dust jacket or a book club printing only exists for a hardcover.
  add constraint user_book_editions_copy_hardcover_only
    check (copy_format = 'hardcover' or (not copy_dust_jacket and not copy_book_club)),
  -- Copy number and edition size only mean something on a limited copy.
  add constraint user_book_editions_copy_limited_details
    check (copy_limited or (copy_limited_number is null and copy_limited_size is null)),
  -- A numbered ("123") or lettered ("AA") copy, stored uppercase.
  add constraint user_book_editions_copy_limited_number_valid
    check (copy_limited_number is null or copy_limited_number ~ '^[A-Z0-9]{1,6}$'),
  add constraint user_book_editions_copy_limited_size_valid
    check (copy_limited_size is null or copy_limited_size >= 1);

-- ---------------------------------------------------------------------------
-- user_books
-- ---------------------------------------------------------------------------

alter table user_books
  add column copy_dust_jacket boolean not null default false,
  add column copy_book_club boolean not null default false,
  add column copy_limited boolean not null default false,
  add column copy_limited_number text,
  add column copy_limited_size int;

alter table user_books
  drop constraint user_books_copy_physical_only,
  add constraint user_books_copy_physical_only
    check (
      copy_format in ('paperback', 'hardcover')
      or (copy_edition is null and copy_printing is null and not copy_signed and not copy_limited)
    ),
  add constraint user_books_copy_hardcover_only
    check (copy_format = 'hardcover' or (not copy_dust_jacket and not copy_book_club)),
  add constraint user_books_copy_limited_details
    check (copy_limited or (copy_limited_number is null and copy_limited_size is null)),
  add constraint user_books_copy_limited_number_valid
    check (copy_limited_number is null or copy_limited_number ~ '^[A-Z0-9]{1,6}$'),
  add constraint user_books_copy_limited_size_valid
    check (copy_limited_size is null or copy_limited_size >= 1);

-- Un-owning still clears every edition-less copy detail, the new ones
-- included.
create or replace function clear_copy_details_on_unowned()
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
    new.copy_dust_jacket := false;
    new.copy_book_club := false;
    new.copy_limited := false;
    new.copy_limited_number := null;
    new.copy_limited_size := null;
  end if;
  return new;
end;
$$;
