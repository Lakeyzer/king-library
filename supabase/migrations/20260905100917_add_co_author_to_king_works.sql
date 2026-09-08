-- Nullable: absent means solely authored by Stephen King, King's byline on
-- every work being the implicit default for this library. Set only for the
-- handful of genuine co-authored titles (The Talisman, Black House, Sleeping
-- Beauties, the Gwendy books, Faithful).
alter table king_works
  add column co_author text;
