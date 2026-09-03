create table adaptations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  release_year int not null,
  tmdb_id int,
  tmdb_media_type text,
  is_universe_only boolean not null default false,
  notes text
);

alter table adaptations enable row level security;

create policy "adaptations readable by everyone"
  on adaptations for select
  using (true);
