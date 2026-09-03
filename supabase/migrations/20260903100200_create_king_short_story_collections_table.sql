create table king_short_story_collections (
  id uuid primary key default gen_random_uuid(),
  short_story_id uuid not null references king_short_stories(id),
  king_work_id uuid not null references king_works(id),
  order_in_collection int,
  unique (short_story_id, king_work_id)
);

alter table king_short_story_collections enable row level security;

create policy "king_short_story_collections readable by everyone"
  on king_short_story_collections for select
  using (true);
