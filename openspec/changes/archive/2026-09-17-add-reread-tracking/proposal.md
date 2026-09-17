## Why

Today `user_books` can only hold one reading cycle per work (a single `started_on`/`finished_on`/`read_year`), so rereading a King work silently overwrites the previous read instead of being recorded as a distinct event, and there's no way to log a note, the format read, or a personal rating against a read. Readers who reread books (common for a King audience revisiting the Dark Tower or favorites) want each pass logged on their timeline without inflating "books read" stats, which must keep counting a work once no matter how many times it's been read.

## What Changes

- Add a "read again" action for a King work that is already marked read, letting a user log another distinct read without first unmarking the work.
- Extend every read-completing flow (finishing a currently-reading work, marking read directly, and the new read-again action) to optionally capture: a note (plain text, max 200 characters), a format (physical, audiobook, or ebook), and a personal rating (1 to 5 stars).
- Persist every read as its own historical record rather than overwriting a single set of columns, so a work read three times has three distinct logged reads, each with its own date/note/format/rating.
- Reading statistics and progress indicators (work-level read counts, showcase progress bars, category completion) continue to count a work as read at most once per user, regardless of how many times it's been reread — no change to their counting behavior.
- The profile reading timeline shows one entry per logged read (not one entry per work), so a reread appears as an additional timeline entry alongside the original, each showing its own note/format/rating.
- Unmarking a work as read now requires confirmation and, on confirmation, deletes every logged read for that work (along with its notes/formats/ratings) and clears its dates — a full reset, not a status flip that preserves history.
- A work that's already marked read can be started again (Start Reading becomes available from the read state), letting a user begin a new reading session on a book they've finished before without unmarking it first; finishing that session logs another distinct read while the work stays marked read throughout.
- A dedicated Reading Timeline page shows every logged read in a vertical layout (including personal ratings), reachable via a link on the showcase's Reading Journey heading and, like Read List/Watch List, both as the signed-in user's own shortcut and by username.
- Starting to read a work now also accepts an optional format, shown as an icon before the title on the showcase's Currently Reading card (whose title is now visible at every viewport width, not only below `lg`).
- The Reading Timeline page's owner can add a logged read directly from that page: an "Add to Timeline" control opens a search-by-title dialog over active King works, and selecting one opens the same mark-as-read prompt used everywhere else in the app for that work.

## Capabilities

### New Capabilities

- `reading-timeline`: a dedicated page showing a user's full reading timeline (every logged read, vertical layout, personal ratings included), reachable as an own-shortcut and by username, following the same reachability/privacy pattern as `read-list`/`watch-list`.

### Modified Capabilities

- `reading-status`: adds a repeatable "read again" action for works already marked read, extends read-completing flows (finish, mark-read-directly, read-again) with optional note/format/rating fields, each read persisted as its own record; changes unmarking read into a confirm-then-delete-all-logged-reads action; and allows starting to read a work that's already marked read (currently-reading and read can now be true at the same time).
- `profile-showcase`: the reading timeline shows every distinct logged read for a work, not just the most recent, each displaying its own note/format/rating; the Reading Journey heading gains an end-justified link to the new Reading Timeline page.

## Impact

- **Database**: a new table (e.g. `user_book_reads`) holding one row per logged read (`user_id`, `king_work_id`, read date, note, format, rating), additive alongside the existing `user_books` columns — no change to `user_books`'s schema or its existing single-cycle columns, which continue to represent the work's current/most-recent read state for stats and quick-status checks. The `clear_read_states_on_progress()` trigger needs a fix so that starting a new read on an already-read work doesn't get its `currently_reading = true` silently reverted by the trigger's existing "read implies not-currently-reading" logic.
- **Composables**: `useBooks()` gains a way to log a read (write a `user_book_reads` row alongside the existing `user_books` update) and to fetch full read history for the timeline, instead of `fetchReadingTimeline()` reading directly off `user_books`. `unmarkRead()` now also deletes the work's `user_book_reads` rows and clears its dates.
- **Components**: `EditReadDatesModal.vue` (or a new modal) gains note/format/rating fields; `ReadingTimeline.vue` renders one entry per read record and gains a vertical-layout mode; reading-status controls gain a "Read again" action and a confirmation step before unmarking read; a new page pair (`profile/timeline.vue`, `profile/[username]/timeline.vue`) hosts the dedicated Reading Timeline.
- **Stats/views**: `work_stats`, showcase progress bars, and category completion views are unaffected — they already dedupe on `user_books.read`.
