-- Reread support (add-reread-tracking) lets a user start reading a work
-- that's already marked read, without unmarking it first - currently_reading
-- and read can now be true at the same time while that new session is in
-- progress. The original unconditional "if new.read = true then
-- currently_reading := false" clause fought this: startReading()'s upsert
-- never touches the `read` column, so on an already-read work NEW.read is
-- true purely because it was already true, not because this write is
-- completing anything - yet the trigger couldn't tell that apart from an
-- actual finish/mark-read/read-again write, and immediately reverted the
-- currently_reading := true this same write had just set.
--
-- Fix: only auto-clear want_to_read/currently_reading when `read` is
-- transitioning to true in this write (same "old.read is distinct from
-- true" pattern already used by cascade_short_story_reads_on_collection_read),
-- not whenever it merely ends up true. This closes a gap for the opposite
-- case - finishing a *second* read on a work that was already read before
-- that session started, where old.read is already true so this trigger no
-- longer fires - which is why finishReading()/markRead()/readAgain() now
-- explicitly set currently_reading: false in their own writes instead of
-- relying on this trigger for it (see useBooks.ts).
create or replace function clear_read_states_on_progress()
returns trigger
language plpgsql
as $$
begin
  if new.currently_reading = true then
    new.want_to_read := false;
  end if;
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    new.want_to_read := false;
    new.currently_reading := false;
  end if;
  return new;
end;
$$;
