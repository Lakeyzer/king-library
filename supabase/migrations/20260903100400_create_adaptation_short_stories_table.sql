create table adaptation_short_stories (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references adaptations(id),
  short_story_id uuid not null references king_short_stories(id),
  unique (adaptation_id, short_story_id)
);

alter table adaptation_short_stories enable row level security;

create policy "adaptation_short_stories readable by everyone"
  on adaptation_short_stories for select
  using (true);
