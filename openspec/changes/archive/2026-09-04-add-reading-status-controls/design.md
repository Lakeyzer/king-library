## Context

`user_books` does not exist in any migration yet — this is the table's first creation, not an addition of columns to something already there. `supabase-conventions` documents its full intended shape (ownership + wishlist + reading-state columns, two triggers, RLS) as one coherent unit; see proposal.md - Why / Impact for why this change creates the whole table even though it only builds UI for the reading-state slice. `/works` (`app/pages/works/index.vue`) already renders each work via `BibliographyBrowsePage` → `BibliographyListItem`, and `BibliographyListItem` already has an unused `#actions` slot reserved by the `works-browsing` spec for exactly this purpose.

## Goals / Non-Goals

**Goals:**
- Stand up `user_books` (table, RLS, both documented triggers) exactly as `supabase-conventions` specifies, so ownership/wishlist work can build on the same table later without a second migration.
- Ship the reading-state entry points (want-to-read toggle, start/finish reading, mark-as-read, unmark-read) as a single state-driven split button per `/works` row, backed by `useBooks()`.
- Keep all state-invariant enforcement in the DB triggers; the composable and UI never replicate that logic.

**Non-Goals:**
- No UI for `owned`/`wishlisted` in this change — those columns and `clear_wishlist_on_owned` exist in the migration but stay dark until a future change builds their UI.
- No editing of recorded dates after the fact — unmarking read flips `read` back to false but never touches `started_on`/`finished_on`/`read_year` — no work detail page changes, no stats/leaderboard display (see proposal.md - Impact).
- No hosted Supabase changes as part of this change; local-only until an explicit go-ahead.

## Decisions

**Create the full `user_books` table now, not a reading-state-only subset.** Alternative considered: migrate only `want_to_read`/`currently_reading`/`started_on`/`read`/`finished_on`/`read_year` plus `clear_read_states_on_progress`, deferring `owned`/`wishlisted`/`clear_wishlist_on_owned` to whenever that UI is built. Rejected because `supabase-conventions` treats `user_books` as one row shape with one unique key and documents both triggers together as "two triggers on the same table, disjoint columns, order doesn't matter" — splitting the migration risks the second migration re-deriving column defaults or the unique constraint slightly differently, and there's no cost to creating an unused boolean column with a trigger that simply never fires yet.

**Fetch the signed-in user's `user_books` rows as a second dataset alongside `king_works`, keyed by `king_work_id`, rather than joining server-side.** `useKingWorks()` stays a pure, cacheable read of the public bibliography; a new `useBooks()` read (e.g. `fetchUserBooks()`) returns the current user's rows, and the page composes the two client-side. This matches the existing composable-per-table convention and means a signed-out visitor's page load skips the second query entirely (RLS would return zero rows anyway, but there's no reason to make the call).

**A single split button (state-driven primary action + dropdown of the rest) replaces three separate always-visible buttons.** The first implementation rendered Want to Read, the reading control, and Mark as Read as three independent buttons — nothing suppressed or relabeled them once a work became `read`, so a finished work still showed a live "Want to Read" toggle and a "Start Reading" button, and there was no visual confirmation the mark-as-read action had done anything. A single primary action tied directly to state (Mark as Read → Start Reading → Finish → Mark as Not Read) both fixes that (the button's own label *is* the confirmation) and cuts the row down to one control instead of three, which was cramped on narrow screens. The remaining actions move into a secondary dropdown (`UDropdownMenu`) rather than disappearing, so nothing is unreachable — e.g. a currently-reading work can still jump straight to Mark as Read without waiting to Finish. Built from `UFieldGroup` wrapping the primary `UButton` and a chevron `UButton` that triggers the `UDropdownMenu`, matching Nuxt UI's standard split-button composition (no dedicated "split button" component exists in this Nuxt UI version).

**The dropdown only lists actions that would have an effect, not a fixed set of five.** E.g. "Want to Read" is left out of the dropdown while a work is currently-reading or read, because `clear_read_states_on_progress` would silently re-clear it the instant it was set — showing it would be a dead click. This means a `read` work's dropdown ends up empty (only "Mark as Not Read" applies), which is accepted as correct: nothing else meaningfully applies to a work in that state, and an empty/disabled chevron communicates that better than padding the list with actions that silently no-op.

**`unmarkRead(workId)` only flips `read` to `false`; it never nulls `started_on`/`finished_on`/`read_year`.** Alternative considered: clear all three dates on unmark, for a clean-slate neutral state. Rejected — the recorded dates are still historically true (the user did read it, starting and finishing on those dates), and keeping them means marking the work read again later doesn't require re-entering data that was never wrong. This is consistent with the skill's existing "known limitation" that these columns hold only the most recent cycle's values, not a history log.

**Three separate modals (start-reading, finish-reading, mark-as-read), not one parameterized "reading date" modal.** They differ in required-vs-optional fields (start-reading's date is mandatory; mark-as-read's three fields are all independently skippable) and in which `useBooks()` function they call. Sharing one modal would mean branching its validation and submit behavior internally — the skill's "Reading dates: three entry points, three different prompts" framing already treats them as three flows, and the composable already exposes three functions, so the UI mirrors that 1:1.

**Local-today prefill computed in the modal's `setup`, not via a composable.** It's a one-line `new Date()` formatted to `YYYY-MM-DD` needed in exactly two modals (start-reading, finish-reading); a shared composable would be overhead for something this small, but both modals must compute it the same way (browser local date, never a server timestamp) — worth calling out here so the two don't drift (e.g. one using `toISOString()`, which is UTC-based and can land on the wrong calendar day near midnight).

## Risks / Trade-offs

- **[Risk]** Creating `owned`/`wishlisted` now with no UI could bit-rot if the future ownership change assumes different defaults or column names once it's actually scoped. → **Mitigation**: the columns, defaults, and trigger are copied verbatim from `supabase-conventions`, which is the agreed source of truth; if that changes, the skill changes first and this table follows.
- **[Risk]** Per-row reading-state controls mean a `/works` list render now needs the user's full `user_books` set client-side; on an account with a very large read history this is a bigger payload than the current King-works-only load. → **Mitigation**: `user_books` is one row per work with eight scalar columns, and the whole bibliography is a few hundred works at most — not a scale where this matters; revisit only if the bibliography grows by an order of magnitude.
- **[Trade-off]** A single primary action that changes meaning based on state is slightly less discoverable than several always-visible buttons, but matches the mutual-exclusivity the data already enforces, gives free visual confirmation of the current state, and is what fixes the original bug report (stale buttons, no visual feedback on read).
- **[Trade-off]** An empty dropdown on a `read` work (only the primary "Mark as Not Read" applies) means the chevron does nothing there. Accepted per the "only show actions that work" rule above rather than padding the list with dead entries.

## Migration Plan

1. Write the migration locally (`supabase migration new create_user_books_table`), apply via local Supabase in Docker, verify against the local instance.
2. Build `useBooks()` and the `/works` UI against local Supabase; manual testing happens there per project convention (no dev server started automatically at task wrap-up).
3. Stop and ask before pushing the migration to hosted — per `supabase-conventions`, hosted schema must land before any dependent code reaches `main` via Vercel's auto-deploy, and that push is a distinct, explicit checkpoint even after local testing looks good.
4. Rollback if needed pre-hosted-push: drop the migration file and re-run local migrations from scratch — safe because nothing has touched hosted or real user data yet.
