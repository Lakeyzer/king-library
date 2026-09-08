alter table king_short_stories
  alter column slug set not null,
  add constraint king_short_stories_slug_key unique (slug);
