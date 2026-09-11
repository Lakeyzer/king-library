create table user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_no_self_follow check (follower_id <> followed_id),
  unique (follower_id, followed_id)
);

alter table user_follows enable row level security;

create policy "user_follows readable by follower"
  on user_follows for select
  using (follower_id = auth.uid());

create policy "user_follows insertable by follower"
  on user_follows for insert
  with check (follower_id = auth.uid());

create policy "user_follows deletable by follower"
  on user_follows for delete
  using (follower_id = auth.uid());
