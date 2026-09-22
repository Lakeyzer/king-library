-- Optional detail: zero or more rows per (user_id, related_work_id), only
-- created when a user records a specific edition. Never determines
-- ownership on its own - user_related_works.owned is always the source of
-- truth for "does the user own this work" - mirrors user_book_editions one
-- table over, see supabase-conventions "user_book_editions".
create table user_related_work_editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  related_work_id uuid not null references related_works (id) on delete cascade,
  edition_id text not null,
  edition_title text not null,
  added_at timestamptz not null default now(),
  unique (user_id, edition_id)
);

alter table user_related_work_editions enable row level security;

create policy "user_related_work_editions readable by owner or if profile public"
  on user_related_work_editions for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_related_work_editions.user_id
      and profiles.is_public = true
    )
  );

create policy "user_related_work_editions writable by owner only"
  on user_related_work_editions for insert
  with check (user_id = auth.uid());

create policy "user_related_work_editions updatable by owner only"
  on user_related_work_editions for update
  using (user_id = auth.uid());

create policy "user_related_work_editions deletable by owner only"
  on user_related_work_editions for delete
  using (user_id = auth.uid());
