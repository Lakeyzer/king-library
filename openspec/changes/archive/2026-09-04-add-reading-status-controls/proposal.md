## Why

`/works` lets users browse the King bibliography but gives them no way to track their reading intent or progress against it — there's no `user_books` table yet at all. Users need to mark a work as want-to-read, start and finish reading it, or log it as already-read, directly from the list they're already browsing.

## What Changes

- Create the `user_books` table for the first time, per the schema documented in `supabase-conventions`: `owned`, `wishlisted`, `want_to_read`, `currently_reading`, `started_on`, `read`, `finished_on`, `read_year`, unique on `(user_id, king_work_id)`.
- Add both invariant-enforcing triggers documented in the skill: `clear_wishlist_on_owned` and `clear_read_states_on_progress`.
- Add the full RLS policy set documented for `user_books` (owner-or-public-profile read, owner-only write) — required for the table to be usable at all, even though this change only exercises the reading-state columns.
- Add `useBooks()` composable with `toggleWantToRead(workId)`, `startReading(workId, startedOn)`, `finishReading(workId, finishedOn)`, `markRead(workId, { startedOn?, finishedOn?, readYear? })`, and `unmarkRead(workId)`. No client-side invariant logic — writes only the fields provided and trusts the triggers; `unmarkRead` only flips `read` to false and leaves `started_on`/`finished_on`/`read_year` untouched.
- Replace the three separate `/works`-list buttons with a single split button per row (`BibliographyListItem`'s existing `#actions` slot): a primary segment whose action depends on state — "Mark as Read" when neutral, "Start Reading" when want-to-read, "Finish" when currently-reading, "Mark as Not Read" when read — and a chevron segment opening a dropdown of the state's other applicable actions, omitting any action the DB triggers would silently no-op (e.g. "Want to Read" while currently-reading or read).
- Per-user `user_books` rows are fetched alongside the existing `king_works` list so each row's controls reflect current state.

## Capabilities

### New Capabilities

- `reading-status`: user-facing want-to-read / currently-reading / read tracking for a King work — the three entry-point flows for `started_on`/`finished_on`/`read_year`, surfaced as controls on the `/works` list.

### Modified Capabilities

- `works-browsing`: each work row on `/works` gains a state-driven split button (primary action + dropdown of other actions) sourced from the signed-in user's `user_books` row.

## Impact

- **Database**: new migration creating `user_books` (table, RLS policies, both triggers) in local Supabase; no hosted changes without explicit go-ahead.
- **Composables**: new `app/composables/useBooks.ts`.
- **UI**: `app/pages/works/index.vue` and `app/components/BibliographyListItem.vue` (or a `/works`-specific wrapper feeding its `#actions` slot); new modal components for start-reading, finish-reading, and mark-as-read date entry.
- **Out of scope**: ownership/editions/wishlist UI, the work detail page, editing recorded dates after the fact (unmarking read does not touch them), and any statistics/leaderboard/progress display — `owned`/`wishlisted` columns and their trigger are created now (they're part of the same table and invariant set) but get no UI in this change.
