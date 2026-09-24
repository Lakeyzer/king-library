-- Reuses the existing clear_read_states_on_progress() function (defined
-- against user_books) - it references its columns generically (new.want_to_read,
-- new.currently_reading, new.read), and user_related_works uses the
-- identical column names, so no new PL/pgSQL is needed. See
-- add-by-other-hands's design.md. (No wishlist trigger here - By Other
-- Hands works have no wishlist concept, see below.)
create trigger user_related_works_clear_read_states
  before insert or update on user_related_works
  for each row
  execute function clear_read_states_on_progress();
