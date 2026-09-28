-- The parent series' name for a single anthology episode (e.g. 'Tales from
-- the Darkside'), shown under the episode's title in the adaptations list.
-- Null on every non-episode row. Tied to tmdb_season_number /
-- tmdb_episode_number by a check added in the next migration, once the
-- seed has backfilled the existing episode rows.

alter table adaptations add column episode_of text;
