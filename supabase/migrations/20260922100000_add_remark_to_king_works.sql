-- Free-text note shown on the /works table and a work's /works/[slug] page,
-- for cases where a plain title/description isn't enough to tell two
-- king_works rows apart - e.g. distinguishing "The Gunslinger" (1982
-- original text) from "The Gunslinger: Revised Edition" (2003), or the two
-- "The Stand" rows, so a user marking a book read picks the right row.
-- Nullable and expected to stay that way - most works need no remark at all.
alter table king_works
  add column remark text;
