-- "The Stand: The Complete & Uncut Edition" was removed from the curated
-- bibliography (supabase/seed/king_works.json). The seed loader only upserts,
-- so the row must be deleted explicitly here. The adaptation_works row that
-- pointed at it has already been re-pointed at the original "The Stand" in
-- supabase/seed/adaptation_works_seed.json; this cascades away any
-- user_books/user_book_editions rows still referencing the removed work.
delete from king_works where id = 'ab577990-5dc5-4e08-ad75-f11febd3809f';
