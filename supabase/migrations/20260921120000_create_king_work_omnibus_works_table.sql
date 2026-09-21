-- Links an 'omnibus' king_work (e.g. "The Bachman Books") to the individual
-- novels it collects. Distinct from king_short_story_collections: that table
-- links a collection to king_short_stories (pieces that only ever exist
-- inside a collection); this one links two king_works rows together, since
-- an omnibus's components are novels that are also independently shelved in
-- their own right. See supabase-conventions "king_work_omnibus_works".
create table king_work_omnibus_works (
  id uuid primary key default gen_random_uuid(),
  omnibus_king_work_id uuid not null references king_works (id) on delete cascade,
  component_king_work_id uuid not null references king_works (id) on delete cascade,
  unique (omnibus_king_work_id, component_king_work_id)
);

alter table king_work_omnibus_works enable row level security;

create policy "king_work_omnibus_works readable by everyone"
  on king_work_omnibus_works for select
  using (true);
