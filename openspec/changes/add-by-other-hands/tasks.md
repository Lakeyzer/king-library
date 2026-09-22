## 1. Database schema

- [x] 1.1 Create migration for `related_works` table (columns, `check` constraint on `category`, unique `slug`) plus public-read RLS policy, applied locally with `supabase migration up`, and verify `supabase migration list` shows it applied
- [x] 1.2 Create migration for `user_related_works` table (columns, unique `(user_id, related_work_id)`, four owner-or-public-profile RLS policies mirroring `user_books`), applied locally with `supabase migration up`
- [x] 1.3 Create migration adding a `user_related_works_clear_read_states` trigger, reusing the existing `clear_read_states_on_progress()` function, and verify with a local SQL check that setting `read = true` clears `want_to_read`/`currently_reading` (revised: no wishlist trigger - see section 6)

## 2. Seed data

- [x] 2.1 Create `supabase/seed/related_works.json` with an initial set of works across all three categories (at minimum a few Dark Tower comics, "Monsters in the Archives," and one tie-in novel if one is confirmed), each with `title`, `creator`, `category`, `slug`, `open_library_work_key` where available, `description`, `relation_note`, `active: true`
- [x] 2.2 Add a `seed:related-works` / `seed:related-works:hosted` loader script pair following the existing `king_works` loader pattern, and verify `pnpm run seed:related-works` populates the local table
- [x] 2.3 Add a `backfill-related-works-cover-ids.ts` script mirroring `backfill-cover-ids.ts`, run it locally, and verify `cover_id` values land in the seed file for entries with an `open_library_work_key`

## 3. Composable

- [x] 3.1 Implement `useRelatedWorks()`: read-only fetch of `related_works` (with category filter support) and read/write of `user_related_works` (owned, want-to-read, currently-reading, read with dates), and verify it compiles with no direct `supabase.from(...)` calls left in any `.vue` file
- [x] 3.2 Add a client-side completion-count helper (read count / total active count) consuming already-fetched data, and verify it returns the correct ratio against seeded local data

## 4. Page & navigation

- [x] 4.1 Build `app/pages/by-other-hands/index.vue` listing works with cover, title, creator, category badge, and relation note, using Nuxt UI components per `nuxt-conventions`
- [x] 4.2 Add category filter control to the page and verify selecting a category narrows the list, per the spec's filter scenarios
- [x] 4.3 Add owned/reading-status controls to each listed work for signed-in users (reusing/adapting existing book-actions UI patterns), hidden for signed-out visitors, and verify each control's effect against local Supabase
- [x] 4.4 Show the signed-in user's completion count on the page and verify it is hidden when signed out
- [x] 4.5 Add the By Other Hands link to `AppHeader.vue` primary navigation and verify it routes to `/by-other-hands`

## 5. Verification

- [x] 5.1 Confirm no existing King stats change: check `work_stats`, `bibliography_items`/`user_read_items`, and the Dark Tower page's progress figures are unaffected after owning/reading By Other Hands works locally, per the spec's exclusion scenarios
- [x] 5.2 Run the project's lint/typecheck scripts and verify they pass

## 6. Revision: remove wishlist, add detail pages and omnibus support

- [x] 6.1 Remove the wishlist state entirely: drop `user_related_works.wishlisted` and its clear-on-owned trigger (edited the not-yet-hosted migrations directly, reconciled local Supabase without a full `db reset`), remove `toggleWishlist` from `useRelatedWorks()`, and remove the wishlist control from `ByOtherHandsActions.vue`
- [x] 6.2 Move the listing page from `app/pages/by-other-hands.vue` to `app/pages/by-other-hands/index.vue` and add `app/pages/by-other-hands/[slug].vue`, a detail page reusing the `detail` layout/`DetailHero`/`DetailConnectionList` components; wire `detailPathPrefix` on `BibliographyBrowsePage` so listing entries link to it
- [x] 6.3 Add omnibus support: `related_works.is_omnibus`, `related_work_omnibus_works` join table, `user_related_works.via_omnibus_id`, and cascade/uncascade triggers mirroring `king_work_omnibus_works`'s; verify locally that marking an omnibus read cascades to its components and unmarking uncascades them
- [x] 6.4 Add `fetchRelatedWorkBySlug` and `fetchComponentWorksForOmnibus` to `useRelatedWorks()`
- [x] 6.5 Research and seed the three Dark Tower comic omnibuses named by the user (Beginnings, The Gunslinger, The Drawing of the Three) plus their component comics, and Robin Furth's Dark Tower Concordance, with real Open Library work keys/covers where available
- [x] 6.6 Regenerate `app/types/database.types.ts` from local schema and verify `pnpm run typecheck`/`pnpm run lint` still pass

## 7. Revision: fix Concordance data, editions, stats, detail-page action parity, list byline

- [x] 7.1 Fix the Dark Tower Concordance seed row to the correct Open Library work (`OL6035242W`, "Stephen King's The Dark Tower: The Complete Concordance"), replacing the earlier mismatched key
- [x] 7.2 Add `user_related_work_editions` table (mirrors `user_book_editions`) and `related_work_stats` view (mirrors `work_stats`), applied locally with `supabase migration up`
- [x] 7.3 Add `useRelatedWorkEditions()` composable (mirrors `useBookshelf()`) and `fetchRelatedWorkStats` on `useRelatedWorks()`, reusing `useOpenLibraryEditions()` unmodified
- [x] 7.4 Add `ByOtherHandsEditionList.vue`, `ByOtherHandsEditionsPickerModal.vue`, and `ByOtherHandsEditionToggle.vue`, mirroring `WorkEditionList.vue`/`BookEditionsPickerModal.vue`/`BookEditionToggle.vue`; wire the Add to Shelf control to open the picker when a work has an Open Library key
- [x] 7.5 Add an `expanded` mode to `ByOtherHandsActions.vue` mirroring `BookReadingActions`' button-per-action layout, and use it (plus stats and the editions list) on the detail page, matching a King work detail page's layout
- [x] 7.6 Add an optional `subtitleOf`/`subtitle` prop to `BibliographyBrowsePage.vue`/`BibliographyListItem.vue` (a line under the title) and use it on the By Other Hands listing for "By {creator}", removing the description/note line from the table row per feedback
- [x] 7.7 Regenerate `app/types/database.types.ts` and verify `pnpm run typecheck`/`pnpm run lint` still pass; verify the editions two-write pattern and `related_work_stats` locally

## 8. Revision: restore mark-as-read on the detail page, add date range/rating/note

- [x] 8.1 Fix `ByOtherHandsActions.vue`'s expanded mode, which had no way to mark a work read without first starting it: add a "Mark as Read" slot shown whenever the work isn't currently-reading and isn't already read; also fix the compact dropdown's `want_to_read` case, which listed a duplicate "Start Reading" item instead of "Mark as Read"
- [x] 8.2 Add `note` (max 200 chars) and `rating` (1-5) columns to `user_related_works`, applied locally with `supabase migration up`, with check constraints verified locally
- [x] 8.3 Extend `useRelatedWorks().markRead()` to accept optional `startedOn`/`finishedOn`/`note`/`rating`, explicitly nulling each unset field on write (no logged-read history to fall back on - see design.md Non-Goals)
- [x] 8.4 Rebuild `ByOtherHandsMarkReadModal.vue` with a `UInputDate` date-range picker, a 5-star rating control, and a note textarea (mirroring `BookMarkReadModal`/`BookReadDetailsFields` minus format/year), prefilling the range's start date from the work's already-recorded `started_on` when finishing a currently-reading work
- [x] 8.5 Regenerate `app/types/database.types.ts` and verify `pnpm run typecheck`/`pnpm run lint` still pass; verify note/rating storage and the rating check constraint locally

## 9. Revision: show action controls to signed-out visitors, open sign-in modal on activation

- [x] 9.1 Fix `ByOtherHandsActions.vue`, `BookReadingActions.vue`, `AdaptationWatchActions.vue`, `ShortStoryReadingActions.vue`, `BookEditionToggle.vue`, and `ByOtherHandsEditionToggle.vue`, all of which hid their controls entirely for a signed-out visitor (`v-if="user"`): show the controls always, and guard every action entry point (dropdown items, expanded-mode buttons, edition toggles) so a signed-out click opens `useAuthModal()` instead of performing the action
- [x] 9.2 Correct `book-collection`'s archived spec (two "signed-out visitor has no control" scenarios) to describe the new behavior, and update the in-progress `by-other-hands` spec's matching scenarios the same way
- [x] 9.3 Verify `pnpm run typecheck`/`pnpm run lint` still pass
