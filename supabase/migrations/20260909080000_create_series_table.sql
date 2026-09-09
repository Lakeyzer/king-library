create table series (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table series enable row level security;

create policy "series readable by everyone"
  on series for select
  using (true);
