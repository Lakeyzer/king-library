-- Adds a 'dark_tower' content area for missing-content reports raised from
-- the Dark Tower page (a connected work that's missing, or one listed that
-- shouldn't be). The Dark Tower lists span king_works and
-- king_short_stories, so there's no single item FK an issue report could
-- use - 'dark_tower' is restricted to missing_content reports.
alter table reports
  drop constraint reports_content_area_check,
  add constraint reports_content_area_check
    check (content_area in ('works', 'short_works', 'adaptations', 'works_by_others', 'dark_tower')),
  add constraint reports_dark_tower_missing_content_only
    check (content_area <> 'dark_tower' or type = 'missing_content');
