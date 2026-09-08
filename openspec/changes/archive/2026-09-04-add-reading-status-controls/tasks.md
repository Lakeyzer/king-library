## 1. Database: `user_books` table, triggers, RLS (local Supabase only)

- [x] 1.1 Confirm current local schema state with `supabase migration list` and by checking `supabase/migrations/` for any existing `user_books` table, then confirm no `user_books` migration exists (per this proposal's research)
- [x] 1.2 Write a new migration (`supabase migration new create_user_books_table`) creating `user_books` per `supabase-conventions`: `id`, `user_id` (FK `auth.users`), `king_work_id` (FK `king_works`), `owned`, `wishlisted`, `want_to_read`, `currently_reading`, `started_on`, `read`, `finished_on`, `read_year`, unique on `(user_id, king_work_id)`
- [x] 1.3 In the same migration, add `clear_wishlist_on_owned()` and its trigger, and `clear_read_states_on_progress()` and its trigger, exactly as documented in the skill
- [x] 1.4 In the same migration, enable RLS on `user_books` and add the four documented policies (select: owner-or-public-profile; insert/update/delete: owner-only)
- [x] 1.5 Apply the migration locally (`supabase start` if not running, then apply) and verify `user_books` exists with correct columns/constraints via `supabase db diff` or a direct query against local Postgres
- [x] 1.6 Manually verify both triggers fire as expected against local Supabase: inserting a row with `currently_reading = true` and `want_to_read = true` together persists with `want_to_read = false`; inserting a row with `read = true` and either progress flag true persists with both false; inserting a row with `owned = true` and `wishlisted = true` together persists with `wishlisted = false`

## 2. Composable: `useBooks()`

- [x] 2.1 Create `app/composables/useBooks.ts` with a `UserBook` type matching the `user_books` columns
- [x] 2.2 Implement `fetchUserBooks()` returning the signed-in user's `user_books` rows (empty array when signed out), verified by calling it locally against a test account with mixed reading states
- [x] 2.3 Implement `toggleWantToRead(workId)`: upserts `want_to_read` to the opposite of its current value for that `(user, work)`, creating the row if absent; verify by toggling a work with no existing row and one with an existing row
- [x] 2.4 Implement `startReading(workId, startedOn)`: upserts `currently_reading = true`, `started_on = startedOn`, writing only those fields; verify a want-to-read row has `want_to_read` cleared afterward (by the trigger, not client logic)
- [x] 2.5 Implement `finishReading(workId, finishedOn)`: updates `read = true`, `finished_on = finishedOn` on the existing row, without touching `started_on`; verify `started_on` from step 2.4 is preserved
- [x] 2.6 Implement `markRead(workId, { startedOn?, finishedOn?, readYear? })`: upserts `read = true` plus whichever of the three optional fields were provided, leaving the rest `null`/unset; verify all three call shapes (all blank, full range, year-only) persist correctly
- [x] 2.7 Confirm no function in this composable manually clears `want_to_read`/`currently_reading`/`wishlisted` — those fields are only ever written when the caller explicitly provides them
- [x] 2.8 Implement `unmarkRead(workId)`: updates `read = false` on the existing row without touching `started_on`, `finished_on`, or `read_year`; verify a previously-set `finished_on`/`read_year` survives the call unchanged, and that `want_to_read`/`currently_reading` remain false afterward

## 3. UI: reading-status controls on `/works`

- [x] 3.1 Wire `/works` (`app/pages/works/index.vue`) to fetch the current user's `user_books` rows via `useBooks()` alongside the existing `king_works` fetch, and key them by `king_work_id`
- [x] 3.2 Replace the standalone want-to-read toggle button with a dropdown item: "Want to Read" appears in the split button's dropdown only when the work is neutral or already want-to-read (never while currently-reading or read, since the DB trigger would silently no-op it there), calling `toggleWantToRead`
- [x] 3.3 Build a start-reading modal component prompting for a start date, prefilled with the browser's local today, confirm calls `startReading`; verify the date input defaults correctly and an adjusted date is respected
- [x] 3.4 Build a finish-reading modal component prompting for an end date with the same local-today prefill, confirm calls `finishReading`; verify `started_on` is untouched after finishing
- [x] 3.5 Build the primary segment of a split button (`UFieldGroup` + `UButton`) per list item, computed from state: "Mark as Read" (neutral, opens the step 3.6 modal), "Start Reading" (want-to-read, opens the step 3.3 modal), "Finish" (currently-reading, opens the step 3.4 modal), "Mark as Not Read" (read, calls `unmarkRead` directly, no modal); verify the label and click behavior switch correctly across all four states
- [x] 3.6 Build a mark-as-read modal component offering an optional start date, end date, and year (any/all blank is valid), confirm calls `markRead`; verify submitting fully blank, fully populated, and year-only all succeed
- [x] 3.7 Replace the standalone "Mark as Read" button with a chevron `UButton` triggering a `UDropdownMenu` next to the primary segment, populated per state per the `works-browsing` delta spec (neutral: Want to Read, Start Reading; want-to-read: remove Want to Read, Mark as Read; currently-reading: Mark as Read; read: empty/disabled) — never duplicating whichever action is already the primary
- [x] 3.8 Verify the actions area is empty for a signed-out visitor and shows the split button (primary + dropdown) for a signed-in user in all four states, matching the `works-browsing` delta spec — including that marking a work read visibly changes the primary action to "Mark as Not Read" and removes Want to Read/Start Reading from view
- [x] 3.9 Manually smoke-test the full set of state transitions in the browser against local Supabase (want-to-read → start reading → finish; direct mark-as-read from neutral state; mark as read → mark as not read, confirming dates survive; toggling want-to-read on and off via the dropdown) and report readiness for review — do not start a dev server as part of finishing this task

## 4. Hosted deployment checkpoint

- [x] 4.1 Stop after local testing looks good and explicitly ask before pushing the migration to hosted Supabase, per `supabase-conventions` — resolved: user confirmed local testing passed and deferred the hosted push to the next release (per this project's release process, hosted migrations ship as part of the release sequence, not immediately per-change)
