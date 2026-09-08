-- Nullable for now, same two-step pattern as king_works/adaptations: backfill
-- via the seed reseed, then a follow-up migration sets not null unique.
alter table king_short_stories
  add column slug text;
