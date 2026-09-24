-- Full release date, from TMDb (movie release_date, or TV first_air_date -
-- the first episode). release_year stays: it's still what slugs, sorting and
-- display use, and the fallback when no date is known. Nullable since not
-- every adaptation necessarily has an exact date on TMDb; populated via
-- supabase/seed/backfill-tmdb-release-dates.ts.
alter table adaptations
  add column release_date date;
