-- An episode row (season + episode number set) must also name its series,
-- and a non-episode row must leave all three null. Replaces the check from
-- 20260928123148_add_episode_numbers_to_adaptations.sql.

alter table adaptations drop constraint adaptations_tmdb_episode_valid;

alter table adaptations
  add constraint adaptations_tmdb_episode_valid check (
    (
      tmdb_season_number is null
      and tmdb_episode_number is null
      and episode_of is null
    )
    or (
      tmdb_media_type is not distinct from 'tv'
      and tmdb_season_number is not null
      and tmdb_episode_number is not null
      and episode_of is not null
      and tmdb_season_number >= 0
      and tmdb_episode_number > 0
    )
  );
