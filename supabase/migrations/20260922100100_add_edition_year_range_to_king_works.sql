-- Restricts which Open Library editions the "Add to Shelf" picker offers for
-- a king_works row, for cases where two rows share one open_library_work_key
-- but represent different texts split by publication year - e.g. the 1982
-- original "The Gunslinger" (edition_year_max = 2002) vs. its 2003 Revised
-- Edition (edition_year_min = 2003). Both nullable and independent: a row
-- with neither set (the common case) shows every edition, unfiltered.
alter table king_works
  add column edition_year_min integer,
  add column edition_year_max integer,
  add constraint king_works_edition_year_range_check
    check (
      edition_year_min is null
      or edition_year_max is null
      or edition_year_min <= edition_year_max
    );
