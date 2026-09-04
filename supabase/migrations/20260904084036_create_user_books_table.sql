create table user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  king_work_id uuid not null references king_works (id) on delete cascade,
  owned boolean not null default false,
  wishlisted boolean not null default false,
  want_to_read boolean not null default false,
  currently_reading boolean not null default false,
  started_on date,
  read boolean not null default false,
  finished_on date,
  read_year int,
  unique (user_id, king_work_id)
);

alter table user_books enable row level security;

create policy "user_books readable by owner or if profile public"
  on user_books for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_books.user_id
      and profiles.is_public = true
    )
  );

create policy "user_books writable by owner only"
  on user_books for insert
  with check (user_id = auth.uid());

create policy "user_books updatable by owner only"
  on user_books for update
  using (user_id = auth.uid());

create policy "user_books deletable by owner only"
  on user_books for delete
  using (user_id = auth.uid());

create function clear_wishlist_on_owned()
returns trigger
language plpgsql
as $$
begin
  if new.owned = true then
    new.wishlisted := false;
  end if;
  return new;
end;
$$;

create trigger user_books_clear_wishlist_on_owned
  before insert or update on user_books
  for each row
  execute function clear_wishlist_on_owned();

create function clear_read_states_on_progress()
returns trigger
language plpgsql
as $$
begin
  if new.currently_reading = true then
    new.want_to_read := false;
  end if;
  if new.read = true then
    new.want_to_read := false;
    new.currently_reading := false;
  end if;
  return new;
end;
$$;

create trigger user_books_clear_read_states
  before insert or update on user_books
  for each row
  execute function clear_read_states_on_progress();
