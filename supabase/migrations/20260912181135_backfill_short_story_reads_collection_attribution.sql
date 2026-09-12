-- The previous migration added via_collection_id but couldn't populate it
-- for rows that already existed - the old cascade trigger never recorded
-- which collection (if any) created a read, so every pre-existing row reads
-- via_collection_id = null. Left alone, uncascade_short_story_reads_on_collection_unread()
-- would never touch those rows: unmarking a collection as read that was
-- already marked read before this feature shipped would silently do
-- nothing to its stories, same broken behavior as before.
--
-- Heuristic: attribute an unattributed read to a collection containing that
-- story, if the same user currently has that collection marked read. This
-- can't distinguish "actually cascaded from this collection" from "read the
-- story individually and separately also has this collection marked read" -
-- there's no way to recover that distinction retroactively - but given the
-- cascade inserts a row for every story in a newly-read collection, the
-- former is overwhelmingly the more likely explanation for any given match.
update user_short_story_reads r
set via_collection_id = ksc.king_work_id
from king_short_story_collections ksc, user_books ub
where ksc.short_story_id = r.short_story_id
  and ub.king_work_id = ksc.king_work_id
  and ub.user_id = r.user_id
  and ub.read = true
  and r.via_collection_id is null;
