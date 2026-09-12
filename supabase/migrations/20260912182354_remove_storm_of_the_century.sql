-- "Storm of the Century" was removed from the curated bibliography
-- (supabase/seed/king_works.json). The seed loader only upserts, so the
-- row must be deleted explicitly here, same as the Stand-Uncut removal in
-- 20260912090100_remove_the_stand_uncut_edition.sql. adaptation_works and
-- king_short_story_collections now cascade on delete (see
-- 20260912090000_cascade_delete_king_work_references.sql), and
-- user_books/user_book_editions already cascaded, so this is a clean delete.
delete from king_works where id = '207e446f-f003-44e0-8079-efbbac07dc58';
