## 1. Database

- [x] 1.1 Create migration `add_copy_details_to_user_books_and_editions`. It adds `copy_format`, `copy_edition`, `copy_printing` and `copy_signed`, with their value checks and the physical-only shape check, to both `user_book_editions` and `user_books` (see design.md "Columns on both tables"). Verify: `supabase migration up` applies cleanly locally, and in SQL an insert of `copy_format = 'ebook', copy_edition = 1` is rejected while `'hardcover', 1, 1, true` is accepted.
- [x] 1.2 In the same migration, add a `before update` trigger on `user_books` that clears the `copy_*` columns when `owned` goes from true to false. Verify in SQL: set copy details on an owned row, update `owned = false`, and the copy columns are null/false.
- [x] 1.3 Update the `supabase-conventions` skill: add the new columns to the `user_books` and `user_book_editions` tables, note how `copy_*` differs from `user_books.format`, and document the un-own trigger under "Triggers". Verify: the skill text matches the migration.

## 2. Shared copy-details logic

- [x] 2.1 Add `app/utils/copyFormat.ts` with the `CopyFormat` and `CopyDetails` types, `COPY_FORMAT_LABEL` / `COPY_FORMAT_ICON` / `COPY_FORMAT_OPTIONS`, `isPhysicalCopyFormat()`, `inferCopyFormat()` and `copyMark()`, following `readFormat.ts`'s shape. Verify: `pnpm typecheck` passes. Check by hand, in a scratch script or the browser console, that "Mass Market Paperback" gives paperback, "Audio CD" gives audiobook, "Hardcover" gives hardcover, "Board book" or null gives null, and that copyMark gives gold for 1/1, silver for 1/3, and null for 1/null, 2/1 and an ebook.
- [x] 2.2 In `useBooks`, add the `copy_*` columns to `UserBook` and `USER_BOOK_COLUMNS`, and add `setCopyDetails(workId, details)`, which updates `user_books` and refreshes `userBooksByWorkId`. Verify: `pnpm typecheck` passes.
- [x] 2.3 In `useBookshelf`, change `addEdition(workId, edition, details)` to insert the copy details and return the inserted row. Add `updateEditionDetails(editionRowId, details)`. Make `fetchBookshelf()` select the `copy_*` columns from both queries and add `copyDetails` to both item types. Verify: `pnpm typecheck` passes and the shelf still loads.

## 3. Copy-details form

- [x] 3.1 Create `book/CopyDetailsFields.vue`: a format select with "Not set", plus edition and printing number inputs (min 1) and a signed checkbox that only show for physical formats. Switching to a non-physical format clears them. Verify: in the browser, switching Hardcover to Ebook hides and clears the three physical fields.
- [x] 3.2 Create `book/CopyDetailsModal.vue`. It wraps the fields, takes an edition or work target, saves through `updateEditionDetails` or `setCopyDetails`, and emits `saved`. It has Save and Skip/Cancel buttons and shows an error toast on failure. Verify: saving updates the row (check in Supabase Studio) and closing without saving changes nothing.
- [x] 3.3 Add the default icons of any Nuxt UI components used here that are not yet bundled to `icon.clientBundle.icons` in `nuxt.config.ts`. Verify: there are no `[Icon] failed to load icon` lines in the dev server log while using the form.

## 4. Add flow

- [x] 4.1 Pass `edition.physicalFormat` from `work/EditionList.vue` to `BookEditionToggle` in both the horizontal and the vertical layout. Verify: `pnpm typecheck` passes.
- [x] 4.2 In `EditionToggle`, work out the starting details on add: the work-level `user_books` copy details if this is the work's first edition and those are set, otherwise the guessed format. Call `addEdition` with them, then open `CopyDetailsModal` pre-filled with them. Removing an edition opens no modal. Verify by hand: adding a "Mass Market Paperback" edition opens the form showing Paperback, and skipping leaves the row stored as paperback. Adding the first edition of a work tagged Hardcover 1/1 without an edition opens the form with Hardcover 1/1. Removing opens nothing.
- [x] 4.3 In `EditionsPickerModal`, show `CopyDetailsFields` and a Save button under the "On my shelf" checkbox while the work is owned with no edition, pre-filled from `userBooksByWorkId` and saved with `setCopyDetails`. Verify by hand: tag an edition-less work as Paperback 1/2. Un-check "On my shelf", re-check it, and the fields come back empty because the trigger cleared them.
- [x] 4.4 Check the stacked picker-plus-details modals at phone width (about 375px). Verify: both modals are usable with no horizontal scroll.

## 5. Bookshelf marks and editing

- [x] 5.1 In `BookshelfTile`, render the gold or silver mark from `copyMark(item.copyDetails)` and the signed indicator from `copy_signed`, both bottom-left over the cover, with tooltips and aria-labels from the profile-showcase spec. Show them to every visitor. Verify by hand with tiles set to 1/1 (gold), 1/4 (silver), 1/no printing (silver, labelled "First edition"), 2/1 (none) and signed 1/1 (gold + signed), viewed both as the owner and signed out on a public profile.
- [x] 5.2 Add the owner-only actions menu (Edit copy details, Remove from shelf) to `BookshelfTile`. Edit opens `CopyDetailsModal` for an edition or work target and emits `updated` with the new details. In `Bookshelf.vue`, patch the matching item in `localItems`. Verify by hand: changing printing 2 to 1 on a first-edition tile turns silver into gold without a reload. Editing an edition-less tile saves to `user_books`. Visitors see no actions menu.
- [x] 5.3 Give every `BookshelfTile` a spine: a left bar at the cover's full height showing the format turned 90 degrees clockwise (the work's title, cut off with an ellipsis, when unset), with the gold/silver mark and signed indicator at its foot instead of over the cover. Verify by hand: Paperback, Hardcover, Audiobook, Ebook and unset tiles all show a spine with the right label (the title for unset). Long titles end in an ellipsis above the marks. Marks sit at the spine's foot. Masonry column heights look the same as before. The spine stays legible on a 2-column phone layout.

## 6. Bookshelf filters

- [x] 6.1 Add the filter state to `Bookshelf.vue`: formats (multi, including "Not set"), edition (any/first/later), printing (any/first/later) and signed only. Apply it inside `visibleItems` together with the title search, and count active filters. Verify: `pnpm typecheck` passes.
- [x] 6.2 Add the "Filters" popover to the Bookshelf toolbar, with the active-count badge and a "Clear filters" action. Update the no-matches description to mention filters. Verify by hand: each spec scenario (format, first/first, filters plus search, later printing hiding tiles with no printing, signed only, matching nothing) behaves as written. The heading count never changes. Group series still groups the filtered tiles. The toolbar wraps without horizontal scroll at phone width.

## 7. Collector details

- [x] 7.1 Add migration `add_collector_copy_details`: `copy_dust_jacket`, `copy_book_club` (hardcover only), `copy_limited`, `copy_limited_number`, `copy_limited_size` on both tables, with the widened physical-only check, the hardcover-only and limited-details checks, and the un-own trigger clearing them. Verify in rolled-back SQL: a paperback with a dust jacket, a limited number without `copy_limited`, and a lowercase number are rejected; a lettered "AA" of 26 hardcover is accepted; un-owning clears every copy field.
- [x] 7.2 Extend `copyFormat.ts`: the new fields in `CopyDetails`/columns/empty value, `normalizeCopyDetails` clearing what the format or limited flag rules out, `pickCopyDetails`, `hasValidLimitedNumber`, `limitedEditionLabel`, book club blocking `copyMark`, and the extra format keywords. Verify with the scratch script against the 784-edition Open Library sample: only "Unknown Binding" and "cd-rom" stay unmatched; labels read "Limited edition, #123 of 750" / "Lettered copy AA of 26".
- [x] 7.3 Add the fields to `CopyDetailsFields` (dust jacket and book club for hardcover; limited checkbox revealing copy number and edition size), and disable Save in `CopyDetailsModal` and the picker while the copy number is invalid. Verify by hand: switching Hardcover to Paperback hides and clears dust jacket and book club; unticking limited clears its number and size; "A-1" shows an error and blocks Save.
- [x] 7.4 Show the limited edition icon on the spine above signed, and add the dust jacket and limited filters. Verify by hand: tooltips match the spec labels; a book club 1/1 shows no gold mark; each new filter narrows the shelf without changing the heading count.
- [x] 7.6 Mark dust-jacket copies on the shelf with an upright open-book icon on the spine directly after the label, plus sr-only text. Verify by hand in light and dark mode: a hardcover with a dust jacket shows the icon right after "HARDCOVER" with a "Dust jacket" tooltip, one without shows none, and a long label still truncates before the icon.
- [x] 7.5 Update the `supabase-conventions` skill with the collector columns, checks and trigger. Verify: the skill text matches both migrations.

## 8. Wrap-up

- [x] 8.1 Run `pnpm lint` and `pnpm typecheck`, and check there is no em dash (U+2014) in any changed file. Verify: both commands pass with no new warnings.
- [x] 8.2 Report what's ready for manual testing against local Supabase. Don't start the dev server.
