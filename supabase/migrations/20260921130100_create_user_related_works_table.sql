-- Per-user tracking for related_works - structurally identical to
-- user_books, but with no FK to king_works/user_books at all, so King
-- reading/collection statistics have nothing here to accidentally include.
-- See add-by-other-hands's design.md.
create table user_related_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  related_work_id uuid not null references related_works (id) on delete cascade,
  owned boolean not null default false,
  want_to_read boolean not null default false,
  currently_reading boolean not null default false,
  started_on date,
  read boolean not null default false,
  finished_on date,
  unique (user_id, related_work_id)
);

alter table user_related_works enable row level security;

create policy "user_related_works readable by owner or if profile public"
  on user_related_works for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_related_works.user_id
      and profiles.is_public = true
    )
  );

create policy "user_related_works writable by owner only"
  on user_related_works for insert
  with check (user_id = auth.uid());

create policy "user_related_works updatable by owner only"
  on user_related_works for update
  using (user_id = auth.uid());

create policy "user_related_works deletable by owner only"
  on user_related_works for delete
  using (user_id = auth.uid());
