alter table king_works
  drop column original_publish_year,
  add column publish_date date not null;
