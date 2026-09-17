-- One row per logged read of a King work - unlike user_books (one row per
-- (user_id, king_work_id), the current/most-recent read summary used by
-- stats), this table preserves every distinct read as its own record so a
-- reread doesn't overwrite history. No unique constraint on
-- (user_id, king_work_id) - rereads are the point. See
-- add-reread-tracking's design.md for why this is additive rather than a
-- change to user_books.
create table user_book_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  king_work_id uuid not null references king_works (id) on delete cascade,
  read_on date,
  read_year int,
  note text,
  format text,
  rating int,
  created_at timestamptz not null default now(),
  constraint user_book_reads_note_length check (note is null or char_length(note) <= 200),
  constraint user_book_reads_format_valid check (format is null or format in ('physical', 'audiobook', 'ebook')),
  constraint user_book_reads_rating_range check (rating is null or (rating between 1 and 5))
);

alter table user_book_reads enable row level security;

create policy "user_book_reads readable by owner or if profile public"
  on user_book_reads for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_book_reads.user_id
      and profiles.is_public = true
    )
  );

create policy "user_book_reads writable by owner only"
  on user_book_reads for insert
  with check (user_id = auth.uid());

create policy "user_book_reads updatable by owner only"
  on user_book_reads for update
  using (user_id = auth.uid());

create policy "user_book_reads deletable by owner only"
  on user_book_reads for delete
  using (user_id = auth.uid());
