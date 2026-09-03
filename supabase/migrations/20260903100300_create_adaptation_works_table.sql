create table adaptation_works (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references adaptations(id),
  king_work_id uuid not null references king_works(id),
  unique (adaptation_id, king_work_id)
);

alter table adaptation_works enable row level security;

create policy "adaptation_works readable by everyone"
  on adaptation_works for select
  using (true);
