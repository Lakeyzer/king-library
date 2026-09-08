## 1. `shuffle_position` schema change

- [x] 1.1 Migration: add `king_works.shuffle_position integer` (nullable) and verify `supabase migration up` applies cleanly against local Supabase.
- [x] 1.2 One-off backfill script that shuffles all existing `king_works` rows into a random permutation of `0..N-1` for every row where `shuffle_position is null`, and verify running it twice in a row leaves positions unchanged the second time (idempotency check).
- [x] 1.3 Migration: set `king_works.shuffle_position not null unique`, and add the `assign_shuffle_position()` `before insert` trigger that fills in `coalesce(max(shuffle_position), -1) + 1` when a new row omits it; verify by inserting a test row locally with no `shuffle_position` and confirming it receives the next value.
- [x] 1.4 Verify `openspec validate` (or the `king-works` spec's scenarios) still pass conceptually: no two works share a shuffle position, and the full set has no gaps.

## 2. Homepage data access

- [x] 2.1 Create `useHomepage()` composable per `supabase-conventions` (no `supabase.from(...)` in `.vue` files), covering: profile count (`select count(*) from profiles`), book of the week lookup, book birthday lookup, least-read book lookup (tie-broken by `shuffle_position`), and thin wrappers around `work_stats`/`adaptation_stats` for the four leaderboards and the two stats-bar totals.
- [x] 2.2 Verify each `useHomepage()` function against local Supabase with seeded test data: book of the week returns the same work across multiple calls within the same ISO week; book birthday returns all matching works (including zero and multiple matches); least-read excludes future-dated works and is stable across repeated calls when tied.

## 3. Homepage page rewrite

- [x] 3.1 Rewrite the hero in `app/pages/index.vue` to be auth-aware: signed-out CTA prompts to start tracking reading progress (links into sign-in), signed-in CTA prompts to add to collection (links into `/works`); verify by loading the page both signed out and signed in.
- [x] 3.2 Build the stats bar (fan count, books read, adaptations watched) using Nuxt UI primitives, verify it renders the three live counts from `useHomepage()`.
- [x] 3.3 Build the Book of the week section (cover/title, links to the work's detail page) and verify it links correctly and matches the composable's current pick.
- [x] 3.4 Build the Book birthday section, including its empty state when no work matches today, and verify both the populated and empty states render correctly (e.g. by temporarily seeding/removing a matching `original_publish_date`).
- [x] 3.5 Build the Most read books and Currently reading leaderboards (top 5 each) and verify ordering matches `work_stats.read_count` / `currently_reading_count` descending.
- [x] 3.6 Build the Least read book section, including the signed-in "already read" state vs. the start-reading prompt shown to everyone else, reusing the existing reading-status flow from `reading-status`/`useBooks()`; verify all three visitor states (signed-out, signed-in-not-read, signed-in-already-read).
- [x] 3.7 Build the Most watched and Least watched adaptations leaderboards (top 5 each) and verify ordering matches `adaptation_stats.watched_count` descending and ascending respectively.
- [x] 3.8 Build the closing Works and Adaptations CTAs (reusing the existing `UPageCTA` sections) and verify both links navigate correctly.
- [x] 3.9 Verify responsive stacking: on a narrow viewport, confirm every section from the two-column area is still present and reachable in the same order, single-column.
- [x] 3.10 Remove the now-unused Short Stories homepage CTA and confirm Short Stories remains reachable via the header's primary navigation (`app-shell`).

## 4. Final verification

- [x] 4.1 Run the project's type-check/lint/build commands and confirm they pass with no new errors.
- [ ] 4.2 Manually walk through the homepage as a signed-out visitor, a signed-in visitor with no reading history, and a signed-in visitor with reading/watch history, confirming every section in `specs/homepage/spec.md` behaves as specified.
