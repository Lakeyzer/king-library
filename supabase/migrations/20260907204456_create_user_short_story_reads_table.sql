-- Row-existence table, not a boolean-flags row: a short story has exactly
-- one meaningful state (read or not), so a row existing IS "has read this
-- story" - see supabase-conventions "user_short_story_reads".
create table user_short_story_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  short_story_id uuid not null references king_short_stories (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (user_id, short_story_id)
);

alter table user_short_story_reads enable row level security;

create policy "user_short_story_reads readable by owner or if profile public"
  on user_short_story_reads for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = user_short_story_reads.user_id
      and profiles.is_public = true
    )
  );

create policy "user_short_story_reads writable by owner only"
  on user_short_story_reads for insert
  with check (user_id = auth.uid());

create policy "user_short_story_reads updatable by owner only"
  on user_short_story_reads for update
  using (user_id = auth.uid());

create policy "user_short_story_reads deletable by owner only"
  on user_short_story_reads for delete
  using (user_id = auth.uid());
