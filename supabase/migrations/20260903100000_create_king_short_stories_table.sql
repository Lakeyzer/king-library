create table king_short_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  original_publish_year int,
  first_published_in text,
  dark_tower boolean not null default false,
  dark_tower_relation text
);

alter table king_short_stories enable row level security;

create policy "king_short_stories readable by everyone"
  on king_short_stories for select
  using (true);
