-- Links an is_omnibus related_work (e.g. "Stephen King's The Dark Tower:
-- Beginnings") to the individual comics it collects - mirrors
-- king_work_omnibus_works one table over. See supabase-conventions
-- "king_work_omnibus_works" and add-by-other-hands's design.md.
create table related_work_omnibus_works (
  id uuid primary key default gen_random_uuid(),
  omnibus_related_work_id uuid not null references related_works (id) on delete cascade,
  component_related_work_id uuid not null references related_works (id) on delete cascade,
  unique (omnibus_related_work_id, component_related_work_id)
);

alter table related_work_omnibus_works enable row level security;

create policy "related_work_omnibus_works readable by everyone"
  on related_work_omnibus_works for select
  using (true);
