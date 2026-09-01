create table king_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  original_publish_year int not null,
  open_library_work_key text
);

alter table king_works enable row level security;

create policy "king_works readable by everyone"
  on king_works for select
  using (true);
