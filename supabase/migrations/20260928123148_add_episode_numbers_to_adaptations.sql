-- Single anthology episodes (type = 'episode', e.g. Tales from the Darkside's
-- "The Word Processor of the Gods") are adaptations rows in their own right.
-- tmdb_id still points at the parent series, and these two columns say which
-- episode of it, so the detail page can fetch that episode's own TMDb details
-- instead of the whole series'. Null on every other row.

alter table adaptations
  add column tmdb_season_number integer,
  add column tmdb_episode_number integer;

alter table adaptations
  add constraint adaptations_tmdb_episode_valid check (
    (tmdb_season_number is null and tmdb_episode_number is null)
    or (
      tmdb_media_type is not distinct from 'tv'
      and tmdb_season_number is not null
      and tmdb_episode_number is not null
      and tmdb_season_number >= 0
      and tmdb_episode_number > 0
    )
  );
