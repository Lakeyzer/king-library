-- User-submitted reports: either an issue on a specific work/short
-- story/adaptation/related work, or a note that something is missing from
-- one of the four canonical lists. Four nullable per-domain FKs rather than
-- a polymorphic (item_type, item_id) pair, so referential integrity is
-- enforced by real foreign keys - same reasoning as
-- adaptation_works/adaptation_short_stories in supabase-conventions. See
-- add-content-reporting's design.md "One `reports` table, four nullable
-- item-reference columns".
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('issue', 'missing_content')),
  content_area text not null check (content_area in ('works', 'short_works', 'adaptations', 'works_by_others')),
  king_work_id uuid references king_works(id) on delete set null,
  short_story_id uuid references king_short_stories(id) on delete set null,
  adaptation_id uuid references adaptations(id) on delete set null,
  related_work_id uuid references related_works(id) on delete set null,
  description text not null check (char_length(description) <= 500 and char_length(description) > 0),
  created_at timestamptz not null default now(),
  constraint reports_item_reference_matches_type check (
    (type = 'missing_content' and king_work_id is null and short_story_id is null and adaptation_id is null and related_work_id is null)
    or (type = 'issue' and (
      (king_work_id is not null)::int + (short_story_id is not null)::int
      + (adaptation_id is not null)::int + (related_work_id is not null)::int = 1
    ))
  )
);

alter table reports enable row level security;

create policy "reports insertable by owner"
  on reports for insert
  with check (user_id = auth.uid());

create policy "reports readable by owner"
  on reports for select
  using (user_id = auth.uid());
