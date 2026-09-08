alter table king_works
  alter column slug set not null,
  add constraint king_works_slug_key unique (slug);

alter table adaptations
  alter column slug set not null,
  add constraint adaptations_slug_key unique (slug);
