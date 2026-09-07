-- Nullable for now - backfilled by supabase/seed/backfill-shuffle-positions.ts,
-- then locked down (not null unique) in a follow-up migration. Same two-step
-- pattern as other not-null columns added to this already-populated,
-- seed-file-driven table (see supabase-conventions).
alter table king_works add column shuffle_position integer;
