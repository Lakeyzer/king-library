create table user_adaptations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  adaptation_id uuid not null references adaptations (id) on delete cascade,
  want_to_watch boolean not null default false,
  watched boolean not null default false,
  watched_at timestamptz,
  unique (user_id, adaptation_id)
);

alter table user_adaptations enable row level security;

create policy "user_adaptations readable by owner or if profile public"
  on user_adaptations for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_adaptations.user_id
      and profiles.is_public = true
    )
  );

create policy "user_adaptations writable by owner only"
  on user_adaptations for insert
  with check (user_id = auth.uid());

create policy "user_adaptations updatable by owner only"
  on user_adaptations for update
  using (user_id = auth.uid());

create policy "user_adaptations deletable by owner only"
  on user_adaptations for delete
  using (user_id = auth.uid());

create function clear_want_to_watch_on_watched()
returns trigger
language plpgsql
as $$
begin
  if new.watched = true then
    new.want_to_watch := false;
  end if;
  return new;
end;
$$;

create trigger user_adaptations_clear_want_to_watch
  before insert or update on user_adaptations
  for each row
  execute function clear_want_to_watch_on_watched();
