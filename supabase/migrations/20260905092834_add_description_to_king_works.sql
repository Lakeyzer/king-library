-- Curated synopsis, authored and stored in our own seed data - never fetched
-- live from Open Library, whose community-edited descriptions can contain
-- outbound links away from the app.
alter table king_works
  add column description text;
