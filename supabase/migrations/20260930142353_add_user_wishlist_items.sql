-- Wishlist entries with a note and tags, replacing the unused
-- user_books.wishlisted flag. See the add-wishlist change's design.md.

-- ---------------------------------------------------------------------------
-- Tag format check
-- ---------------------------------------------------------------------------

-- Tags are free-form (predefined ones live in app/utils/wishlistTags.ts, and
-- users can add their own), so the database can't hold an allow-list. It
-- enforces the normalized shape instead: lowercase alphanumeric words joined
-- by single hyphens, 1-30 characters, no nulls, no duplicates.
create function valid_wishlist_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    bool_and(tag is not null and tag ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(tag) <= 30),
    true
  )
  and count(*) = count(distinct tag)
  from unnest(tags) as tag
$$;

-- ---------------------------------------------------------------------------
-- user_wishlist_items
-- ---------------------------------------------------------------------------

-- No unique (user_id, work_id): a user can hold several entries for the same
-- work (e.g. "signed first printing" and a separate "cheap reading copy"),
-- each with its own note and tags. Independent of user_books - wishlisting
-- never creates, changes, or reads a user_books row.
create table user_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id uuid not null references works (id) on delete cascade,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_wishlist_items_note_length check (note is null or char_length(note) <= 1000),
  constraint user_wishlist_items_tags_count check (cardinality(tags) <= 10),
  constraint user_wishlist_items_tags_format check (valid_wishlist_tags(tags))
);

-- Serves the profile Wishlist tab (one user's entries, newest first) and the
-- signed-in user's own by-work lookup.
create index user_wishlist_items_user_created_idx on user_wishlist_items (user_id, created_at desc);
create index user_wishlist_items_work_idx on user_wishlist_items (work_id);

create function stamp_user_wishlist_items_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_wishlist_items_stamp_updated_at
  before update on user_wishlist_items
  for each row
  execute function stamp_user_wishlist_items_updated_at();

-- Same four-policy owner/public set as user_books.
alter table user_wishlist_items enable row level security;

create policy "user_wishlist_items readable by owner or if profile public"
  on user_wishlist_items for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = user_wishlist_items.user_id
      and profiles.is_public = true
    )
  );

create policy "user_wishlist_items writable by owner only"
  on user_wishlist_items for insert
  with check (user_id = (select auth.uid()));

create policy "user_wishlist_items updatable by owner only"
  on user_wishlist_items for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_wishlist_items deletable by owner only"
  on user_wishlist_items for delete
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Retire user_books.wishlisted
-- ---------------------------------------------------------------------------

-- No UI ever wrote the flag, but carry any set rows over as untagged entries
-- before dropping it so nothing is lost.
insert into user_wishlist_items (user_id, work_id)
select user_id, work_id from user_books where wishlisted;

-- Wishlisting no longer excludes ownership ("I own it, but want a better
-- copy"), so the trigger that cleared the flag on owned goes with it.
drop trigger user_books_clear_wishlist_on_owned on user_books;
drop function clear_wishlist_on_owned();

alter table user_books drop column wishlisted;
