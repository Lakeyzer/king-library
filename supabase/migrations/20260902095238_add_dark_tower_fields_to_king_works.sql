alter table king_works
  add column dark_tower boolean not null default false,
  add column bachman boolean not null default false,
  add column dark_tower_relation text;
