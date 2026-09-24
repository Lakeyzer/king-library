-- Groups two king_works rows that represent alternate texts of the same
-- book (e.g. "The Gunslinger" original vs. its Revised Edition) into one
-- slot for reading-progress totals, without merging them into a single row -
-- each still needs its own title, cover, editions and independent read
-- status, since a user can own/read either or both. On the "alternate" row,
-- this points at the "primary" row it shares a progress slot with; the
-- primary row itself leaves this null. Progress math (see
-- fetchProfileBookStats/dark_tower_journey_stats) groups by
-- coalesce(counts_with_id, id) so the pair counts as one book toward a
-- total, and reading either one satisfies that slot - but this column does
-- NOT cascade the `read` flag itself between the two rows (each row's own
-- read status still reflects only what the user actually did to that row).
-- `on delete set null` rather than `cascade`: removing the primary work from
-- the bibliography shouldn't delete the alternate, just ungroup it.
alter table king_works
  add column counts_with_id uuid references king_works (id) on delete set null;
