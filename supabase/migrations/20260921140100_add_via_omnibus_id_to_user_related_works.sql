-- Mirrors user_books.via_omnibus_id one table over - records which
-- omnibus's read-cascade (if any) marked this user_related_works row read,
-- so the uncascade trigger can tell a comic the user read on its own apart
-- from one only marked read because an omnibus containing it was. Null
-- means the user marked this row read directly.
alter table user_related_works
  add column via_omnibus_id uuid references related_works (id) on delete set null;
