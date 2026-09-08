-- Nullable for now: king_works is a seed-file-driven table already populated
-- with rows on hosted, so a `not null` publish_date needs the seed reseed to
-- backfill values first. A follow-up migration sets `not null` once that
-- reseed has run (see supabase-conventions: "don't reach for db reset to
-- sidestep this - split into two migrations instead").
alter table king_works
  drop column original_publish_year,
  add column publish_date date;
