-- Links a related_work (By Other Hands) to the king_works it's connected to,
-- e.g. Gwendy's Magic Feather -> Gwendy's Button Box and Gwendy's Final Task,
-- or Marvel's Beginnings comics -> Wizard and Glass. Many-to-many in both
-- directions: a King work's page lists its related works, and a related
-- work's page lists the King works it relates to. Same seed-file-maintained,
-- read-only-at-runtime pattern as adaptation_works.
create table related_work_king_works (
  id uuid primary key default gen_random_uuid(),
  related_work_id uuid not null references related_works (id) on delete cascade,
  king_work_id uuid not null references king_works (id) on delete cascade,
  unique (related_work_id, king_work_id)
);

-- The unique constraint already covers lookups by related_work_id; this
-- covers the other direction (a King work's page).
create index related_work_king_works_king_work_id_idx
  on related_work_king_works (king_work_id);

alter table related_work_king_works enable row level security;

create policy "related_work_king_works readable by everyone"
  on related_work_king_works for select
  using (true);
