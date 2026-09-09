create table series_works (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references series (id) on delete cascade,
  king_work_id uuid not null references king_works (id) on delete cascade,
  position int not null,
  unique (series_id, king_work_id),
  unique (series_id, position)
);

alter table series_works enable row level security;

create policy "series_works readable by everyone"
  on series_works for select
  using (true);
