## Why

The Bookshelf shows which works and editions a collector owns, but not what kind of copy each one is. Collectors care about the format, the edition, the printing, and whether a copy is signed. A first-edition, first-printing hardcover is the thing a King collector is proudest of, and right now the shelf can't record that or show it.

## What Changes

- Every copy on the shelf can carry **copy details**:
  - **Format**: Paperback, Hardcover, Audiobook or Ebook, or not set.
  - **Edition number** and **printing number**: whole numbers (1, 2, 3...), only for Paperback and Hardcover.
  - **Signed**: a yes/no flag, only for Paperback and Hardcover.
  - **Dust jacket** and **Book club edition**: yes/no flags, only for Hardcover. A book club copy never gets a gold or silver mark, since collectors don't count it as a true first.
  - **Limited edition**: a yes/no flag for Paperback and Hardcover, with an optional copy number ("123", or "AA" for a lettered copy) and edition size ("of 750").
- Copy details work on both kinds of shelf tile: a picked Open Library edition, and a work that is marked "On my shelf" with no edition picked.
- When an edition is added from an editions list, the format is **guessed from the Open Library edition's physical format** (for example "Mass Market Paperback" becomes Paperback, "Audio CD" becomes Audiobook). The edition is still added straight away with the guessed format, and then a small copy-details form opens. In that form the user can confirm or change the format and set the edition, printing and signed flag. The form can be skipped.
- Marking a work "On my shelf" without an edition shows the same copy-details fields.
- **Shelf marks**, visible to everyone who can see the shelf:
  - Gold mark: a Paperback or Hardcover copy that is 1st edition, 1st printing.
  - Silver mark: a Paperback or Hardcover copy that is 1st edition, with a 2nd or later printing or no printing entered.
  - Signed indicator: any signed copy.
  - Limited edition indicator: any limited copy, with a tooltip like "Limited edition, #123 of 750".
  - Dust jacket indicator: an open-book icon on the spine, right after the format label.
- The profile owner can **edit** a tile's copy details from the Bookshelf.
- Anyone viewing the Bookshelf can **filter** it by format, edition (first / later), printing (first / later), signed, dust jacket and limited edition. Filters combine with the existing title search.

## Capabilities

### New Capabilities

None. Copy details extend the existing collection and Bookshelf capabilities.

### Modified Capabilities

- `book-collection`: adding an edition now guesses the format and offers a copy-details form. Edition-less ownership also takes copy details. The allowed values and rules for copy details are defined here.
- `profile-showcase`: the Bookshelf gets gold and silver marks, signed and limited edition indicators, an owner-only edit control, and copy-details filters. The heading count requirement now also ignores the new filters, not just search.

## Impact

- **Database**: new nullable copy-detail columns plus check constraints on `user_book_editions` and `user_books`, in two migrations (the base copy details, then the collector fields). The existing owner-only update and owner-or-public read RLS policies already cover the new columns, so no new policies are needed. It has to be pushed to hosted before merge, as usual.
- **Composables**: `useBookshelf` (add with details, update details, return details from `fetchBookshelf`) and `useBooks` (edition-less copy details, clearing them when a work stops being owned).
- **Components**: `book/EditionToggle.vue`, `work/EditionList.vue`, `book/EditionsPickerModal.vue`, `profile/Bookshelf.vue`, `profile/BookshelfTile.vue`, plus a new shared copy-details form and modal.
- **Utils**: a new copy-format util (labels, icons, guessing from Open Library) next to `readFormat.ts`.
- **Docs**: the `supabase-conventions` skill gets the new columns.
- No new external dependencies. The Open Library data needed (`physical_format`) is already fetched.
