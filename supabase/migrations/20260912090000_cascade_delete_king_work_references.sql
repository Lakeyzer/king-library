-- Deleting a king_works row should remove every row that refers to it,
-- not fail with a foreign key violation. user_books/user_book_editions/series_works
-- already cascade; adaptation_works and king_short_story_collections did not.
alter table adaptation_works
  drop constraint adaptation_works_king_work_id_fkey,
  add constraint adaptation_works_king_work_id_fkey
    foreign key (king_work_id) references king_works (id) on delete cascade;

alter table king_short_story_collections
  drop constraint king_short_story_collections_king_work_id_fkey,
  add constraint king_short_story_collections_king_work_id_fkey
    foreign key (king_work_id) references king_works (id) on delete cascade;
