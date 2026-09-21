-- Records which omnibus's read-cascade (if any) marked this user_books row
-- read, so the uncascade trigger can tell a book the user read on its own
-- apart from one only marked read because an omnibus containing it was -
-- same reasoning and shape as user_short_story_reads.via_collection_id. Null
-- means the user marked this book read directly.
alter table user_books
  add column via_omnibus_id uuid references king_works (id) on delete set null;
