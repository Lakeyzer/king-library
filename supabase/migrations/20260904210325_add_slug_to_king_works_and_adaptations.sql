-- Nullable for now: king_works and adaptations are seed-file-driven tables
-- already populated with rows, so a `not null` slug needs the seed reseed to
-- backfill values first. A follow-up migration adds `not null unique` once
-- that reseed has run (see supabase-conventions: "don't reach for db reset
-- to sidestep this - split into two migrations instead").
alter table king_works
  add column slug text;

alter table adaptations
  add column slug text;
