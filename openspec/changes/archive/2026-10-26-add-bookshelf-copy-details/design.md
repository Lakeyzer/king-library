## Context

See proposal.md for the motivation. Today:

- A shelf tile is either an **edition tile** (one `user_book_editions` row) or a **work tile** (a `user_books` row with `owned = true` and no edition rows). `useBookshelf().fetchBookshelf()` builds both kinds.
- `user_books.format` already exists, but it is the format of the **current reading session** (`physical` / `audiobook` / `ebook`), written by `startReading()`. It is unrelated to the copy someone owns and must not be reused.
- `useOpenLibraryEditions()` already returns `physicalFormat` (Open Library's free-text `physical_format`). `work/EditionList.vue` shows it but doesn't pass it to `book/EditionToggle.vue`.
- `EditionToggle` is a one-click add/remove button used in two layouts of `EditionList`, which itself appears on work pages and inside `EditionsPickerModal`.
- There are no automated tests. Verification is `pnpm typecheck`, `pnpm lint` and manual testing against local Supabase.

## Goals / Non-Goals

**Goals:**
- One copy-details shape, stored the same way on both tile kinds and edited through one shared form.
- The database enforces the "edition/printing/signed only for physical" rule, so the UI can't drift from it.
- The shelf marks and filters work entirely on data `fetchBookshelf()` already returns. No extra queries per tile.

**Non-Goals:**
- Guessing edition or printing from Open Library's `edition_name` (e.g. "1st Signet printing"). That text is too inconsistent, and a wrong guess would hand out undeserved gold marks.
- Free-form labels or tags on shelf items (the wishlist's tag model). Copy details are a fixed set of fields.
- Showing copy details anywhere other than the Bookshelf and the copy-details form (no work-page badge, no statistics).
- Recording more than one copy of the same Open Library edition. `unique (user_id, edition_id)` stays.

## Decisions

### Columns on both tables, with the same `copy_` names

Add to **both** `user_book_editions` and `user_books`:

| column | type | rule |
| --- | --- | --- |
| `copy_format` | text, nullable | `check (copy_format in ('paperback','hardcover','audiobook','ebook'))` |
| `copy_edition` | int, nullable | `check (copy_edition >= 1)` |
| `copy_printing` | int, nullable | `check (copy_printing >= 1)` |
| `copy_signed` | boolean, not null, default `false` | |

A second migration (`add_collector_copy_details`) adds the collector fields to both tables:

| column | type | rule |
| --- | --- | --- |
| `copy_dust_jacket` | boolean, not null, default `false` | hardcover only |
| `copy_book_club` | boolean, not null, default `false` | hardcover only |
| `copy_limited` | boolean, not null, default `false` | physical only |
| `copy_limited_number` | text, nullable | `^[A-Z0-9]{1,6}## Context

See proposal.md for the motivation. Today:

- A shelf tile is either an **edition tile** (one `user_book_editions` row) or a **work tile** (a `user_books` row with `owned = true` and no edition rows). `useBookshelf().fetchBookshelf()` builds both kinds.
- `user_books.format` already exists, but it is the format of the **current reading session** (`physical` / `audiobook` / `ebook`), written by `startReading()`. It is unrelated to the copy someone owns and must not be reused.
- `useOpenLibraryEditions()` already returns `physicalFormat` (Open Library's free-text `physical_format`). `work/EditionList.vue` shows it but doesn't pass it to `book/EditionToggle.vue`.
- `EditionToggle` is a one-click add/remove button used in two layouts of `EditionList`, which itself appears on work pages and inside `EditionsPickerModal`.
- There are no automated tests. Verification is `pnpm typecheck`, `pnpm lint` and manual testing against local Supabase.

## Goals / Non-Goals

**Goals:**
- One copy-details shape, stored the same way on both tile kinds and edited through one shared form.
- The database enforces the "edition/printing/signed only for physical" rule, so the UI can't drift from it.
- The shelf marks and filters work entirely on data `fetchBookshelf()` already returns. No extra queries per tile.

**Non-Goals:**
- Guessing edition or printing from Open Library's `edition_name` (e.g. "1st Signet printing"). That text is too inconsistent, and a wrong guess would hand out undeserved gold marks.
- Free-form labels or tags on shelf items (the wishlist's tag model). Copy details are a fixed set of fields.
- Showing copy details anywhere other than the Bookshelf and the copy-details form (no work-page badge, no statistics).
- Recording more than one copy of the same Open Library edition. `unique (user_id, edition_id)` stays.

## Decisions

### Columns on both tables, with the same `copy_` names

Add to **both** `user_book_editions` and `user_books`:

| column | type | rule |
| --- | --- | --- |
| `copy_format` | text, nullable | `check (copy_format in ('paperback','hardcover','audiobook','ebook'))` |
| `copy_edition` | int, nullable | `check (copy_edition >= 1)` |
| `copy_printing` | int, nullable | `check (copy_printing >= 1)` |
| `copy_signed` | boolean, not null, default `false` | |

 (numbered "123" or lettered "AA"), limited only |
| `copy_limited_size` | int, nullable | `>= 1`, limited only |

Shape checks on each table: `*_copy_physical_only` (edition, printing, signed and limited need paperback or hardcover), `*_copy_hardcover_only` (dust jacket and book club need hardcover) and `*_copy_limited_details` (number and size need `copy_limited`).

- *Why a second migration rather than editing the first:* the first was already applied locally, and `db reset` is off-limits, so `migration up` needs a new file. Both ship to hosted together.
- *Why the copy number is text:* lettered copies (A-Z, AA-ZZ) are as common as numbered ones in the Grant and Cemetery Dance editions. It's stored uppercase, and the edition size is a separate integer so "#123 of 750" can be shown and filtered on.

On `user_books` these columns describe the edition-less copy. They only apply while the work has no edition rows.

- *Why the `copy_` prefix:* it keeps them apart from `user_books.format` (reading session), and gives the same names on both tables, so one TypeScript type and one form serve both.
- *Alternative: a separate `user_copies` table that both tile kinds point at.* It is cleaner in theory, but it adds a third table to the ownership rules (`user_books.owned` and edition rows) and joins to every shelf query, for four columns. Rejected.
- *Alternative: storing the format as `physical` plus a sub-type, to reuse `ReadFormat`.* The user asked for Paperback vs Hardcover as first-class choices, and filters need them. A separate `CopyFormat` type is simpler than nesting.

Existing RLS covers the new columns: `user_book_editions` and `user_books` already have owner-only update and owner-or-public-profile select. No policy changes.

### A trigger clears edition-less copy details when a work is un-owned

`before update on user_books`: when `owned` goes from `true` to `false`, set the four `copy_*` columns back to null/false. That follows the `user_books` convention of enforcing invariants with triggers (read clears want_to_read, etc.). It also covers every un-own path at once: the shelf remove modal, the "On my shelf" checkbox, and `removeEdition()` removing the last edition.

- *Why not in `setOwned()`:* the client would have to remember it on every caller, and a stale copy-details row would bring back old details when the work is owned again (see the spec scenario "Un-owning clears the details").

### Format guessing lives in a pure util

A new `app/utils/copyFormat.ts`, next to `readFormat.ts` and in the same shape: `COPY_FORMAT_LABEL`, `COPY_FORMAT_ICON`, `COPY_FORMAT_OPTIONS`, `isPhysicalCopyFormat()`, `inferCopyFormat(physicalFormat: string | null): CopyFormat | null`, `copyMark(details): 'gold' | 'silver' | null` (a physical 1st edition is gold for printing 1, silver for any other printing including none) and `copyMarkLabel(details)` (silver with no printing reads "First edition", since it can't claim "later printing").

`inferCopyFormat` lowercases the input and checks keyword lists in order: hardcover first, so "hardcover with dust jacket" can't fall through, then paperback, audiobook, ebook. The keywords are the ones in the book-collection spec. `copyMark` is the only place the gold/silver rule exists, so the tile and the filters can't disagree.

### Add flow: insert with details, then open the form

`EditionToggle` gains a `physicalFormat` prop, which `EditionList` passes in both layouts. On add:

1. `useBookshelf().addEdition(workId, edition, details)` inserts the row with the starting details:
   - if this is the work's first edition and the `user_books` row has copy details, use those (the spec's carry-over scenario)
   - otherwise use `{ copy_format: inferCopyFormat(physicalFormat) }`
2. `EditionToggle` then opens `BookCopyDetailsModal` for the new row, pre-filled with those same starting details.

Saving calls `updateEditionDetails(editionRowId, details)`. Closing the modal does nothing, because the starting details are already stored.

- *Why insert first:* the user chose this. It also keeps the one-click add working for people who don't care about copy details.
- `addEdition` must return the inserted row's `id` (it doesn't today), so the modal can target it. `userEditionsByWorkId` stays a `Set<edition_id>`. The details live on shelf items, not in that lookup, since only the shelf and the modal need them.
- The modal opens on top of `EditionsPickerModal` when adding from the picker. Nuxt UI supports stacked modals, so this needs no special handling.

### One form component, three hosts

- `book/CopyDetailsFields.vue`: a `v-model` of `CopyDetails`. It contains a format `USelect` with a "Not set" option, `UInputNumber` for edition and printing (min 1, blank allowed), and a `UCheckbox` for signed. The last three only show when the format is physical. Switching to a non-physical format clears them in the model, matching the DB check.
- `book/CopyDetailsModal.vue`: wraps the fields with Save and Skip/Cancel buttons. It takes a `target`, either `{ kind: 'edition', editionRowId }` or `{ kind: 'work', workId }`, and calls the matching composable method. It emits `saved` with the new details.
- Hosts:
  - `EditionToggle` (after add)
  - `BookshelfTile` (edit)
  - `EditionsPickerModal`: shows `CopyDetailsFields` inline under the "On my shelf" checkbox while it is checked and no edition exists, with a Save button that calls `useBooks().setCopyDetails(workId, details)`

### Composable surface

- `useBookshelf`:
  - `addEdition(workId, edition, details)` now returns the row
  - new `updateEditionDetails(editionRowId, details)`
  - `fetchBookshelf()` selects the `copy_*` columns from both tables and puts a `copyDetails: CopyDetails` field on both `BookshelfEditionItem` and `BookshelfWorkItem`
- `useBooks`:
  - `USER_BOOK_COLUMNS` and `UserBook` gain the `copy_*` columns
  - new `setCopyDetails(workId, details)` updates `user_books`. Writing `user_books` stays inside `useBooks`, matching how `addEdition` already delegates to `setOwned`.

Both shelf queries keep covering both kinds (King and related), as today. No `kind` filter is added.

### Shelf UI

- **Spine and marks**: every tile is a flex row inside the existing `NuxtLink`. On the left is a `w-7` spine bar with `px-1` (less than its vertical padding) (solid `bg-accented`, plus a right border) that stretches to the cover's natural height; `contain-size` stops a long label from stretching the row past the cover, so the masonry heights are unchanged. It shows `COPY_FORMAT_LABEL[copy_format]` in small uppercase text (bold for Hardcover so it stands out, regular weight otherwise) with `writing-mode: vertical-rl` (90 degrees clockwise, like a spine title), or the work's title (normal case) when the format is unset. The label is `min-h-0 flex-1` with `text-overflow: ellipsis`, so a long title or format is cut off before the marks. At its foot sit, top to bottom, the limited edition `i-lucide-gem` icon (tooltip from `limitedEditionLabel()`), the signed `i-lucide-signature` icon and, at the very bottom, the mark (an `i-lucide-award` icon), as bare coloured icons with no badge: gold `text-amber-500`, silver `text-highlighted` (white in dark mode), signed and limited `text-toned` (light grey in dark mode), using theme tokens since the app themes via the `.dark` class, each with an `aria-label` and a `UTooltip` giving the spec labels. They come from `copyMark()` / `copyMarkLabel()`, `copy_signed` and `limitedEditionLabel()`, and render for every visitor. Book club has no tile indicator and no filter; it only affects the gold/silver mark. Dust jacket shows as an upright `i-lucide-book-open` icon on the spine directly after the label, in the label's `text-muted` (the label and icon share a `min-h-0 flex-1` group so the label still truncates, so light grey in dark mode and dark grey in light mode), chosen from four prototyped options (outlines round the spine, the cover or the whole tile, and top strips and a fold line, were all tried first and dropped), with sr-only "With dust jacket" text.
- **No book depth effect**: the tile stays flat, with only a drop shadow (`drop-shadow-[0_6px_5px_rgb(0_0_0/0.35)]` on the wrapper) to lift it off the page. A real CSS 3D box (distorted the cover, made the spine unreadable) and a flat drawing with a slanted spine, page block and drop shadow were both tried and dropped as too busy.
- **Edit**: the tile's owner-only controls are one icon-only (`variant="link"`, no padding) `i-lucide-ellipsis-vertical` `UDropdownMenu` button (the same per-item actions pattern as `ReadingActions`, `WatchActions` and the profile `Header`), with "Edit copy details" and "Remove from shelf" items, laid over the top of the spine (a sibling of the `NuxtLink`, since a button cannot nest in an `<a>`; the owner's spine label starts lower to make room), always visible. Saving emits `updated` with the new details. `Bookshelf.vue` patches the matching item in `localItems`, the same way removal patches it today.
- **Filters**: a "Filters" `UPopover` button in the existing toolbar. It shows the number of active filters as a `UBadge`. Inside: a format `USelectMenu` (multiple, including "Not set"), edition and printing `USelect` (Any / First / Later), a signed-only `UCheckbox`, and a "Clear filters" button. Filtering joins the existing `visibleItems` computed alongside the title search, so sorting, grouping and the heading count (which reads `localItems`) all keep working unchanged.
- Icons: new app icons (`i-lucide-award`, `i-lucide-signature`, `i-lucide-pencil`, `i-lucide-filter`) are written as complete string literals, so the build scanner bundles them. Any default icons of Nuxt UI components the app hasn't used before (e.g. `UInputNumber`'s plus/minus, `USelectMenu`'s check/search) must be added by hand to `icon.clientBundle.icons` in `nuxt.config.ts`, per `nuxt-conventions` "Icons".

## Risks / Trade-offs

- [Open Library `physical_format` is free text and often missing] → Guessing only sets a default that the user sees and can correct in the form straight away. If nothing matches, the format is left unset rather than guessed wrongly.
- [Work-level copy details stay hidden in `user_books` once an edition is picked] → They are copied into the first edition's form, so nothing is lost. They are cleared when the work is un-owned. Until then they are invisible and harmless.
- [Stacked modals on a phone (picker, then details)] → The details form is short (four fields). Test it on a narrow viewport as part of manual testing.
- [The DB rejects a physical-only field on a non-physical format] → The form clears those fields when the format changes, so a valid UI never sends that combination. A rejected write shows the existing error toast pattern.

## Migration Plan

1. One migration, `add_copy_details_to_user_books_and_editions`. It adds the columns, checks and trigger. Everything is nullable or defaulted, so it is additive and safe on populated tables, with no backfill.
2. Apply locally with `supabase migration up` (never `db reset`), then test by hand.
3. Push to hosted before merging to `main`, only after an explicit go-ahead.
4. Rollback: drop the trigger and the columns. Older code never selects them, so reverting the app alone is also safe.
