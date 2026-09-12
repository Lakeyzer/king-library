## Why

The app is a personal library for a single author's body of work with a lot of shared lore. A handful of small, hidden references rewards attentive fans and gives the app more personality without changing any core functionality.

## What Changes

- Dark mode toggle in the header shows the hover/tooltip text "That spells dark mode" (Tom Cullen's M-O-O-N bit from *The Stand*).
- Any rendered text containing the exact standalone number `19` or `1999` (not as part of a longer number like `1987` or `219`) is styled with a `text-warning` span app-wide, as a Dark Tower numerology nod.
- The Bookshelf tile removal confirmation (the app's one true "are you sure?"-style confirm dialog) is reworded to "Say true?" with a "Say thankya" confirm action, per Dark Tower ka-tet affirmation phrasing.
- Signing out shows the farewell message "Long days and pleasant nights" (the Gilead greeting).
- A new app-wide not-found page, styled around *The Shining*'s Overlook Hotel (hallway/maze visual treatment), replaces the default error page for unmatched routes and existing "not found" results (unknown work/adaptation/profile slugs).
- Searching "217" with no matching results on the Works, Short Stories, or Adaptations browsing pages, or in the global search dialog, shows an eerie message ("You weren't supposed to find this.") instead of the normal empty-search state, referencing the Overlook's Room 217 (237 in the film).
- The Charlie the Choo-Choo work detail page's author, shown as "Beryl Evans", loops indefinitely with "Claudia y Inez Bachman" at a regular interval while the page is open, each change animated with a letter-scramble transition — the *Wolves of the Calla* book-within-a-book gag.
- The Misery work detail page and the Misery adaptation detail page render every letter "N" in the page's own content (header and footer excluded) at reduced opacity, referencing Paul Sheldon's typewriter missing its N key.
- Out of scope: the delete-account confirmation already reads "Go then, there are other apps than these." (existing easter egg) — left unchanged.

## Capabilities

### New Capabilities
- `number-motifs`: app-wide detection and styling of the exact standalone numbers `19` and `1999` in rendered page text.
- `not-found-page`: a shared, Overlook Hotel-themed not-found page used for unmatched routes and existing per-entity "not found" results, including the Room 217 search variant.

### Modified Capabilities
- `app-shell`: color mode toggle control gains hover/tooltip text.
- `user-auth`: sign out gains a farewell message.
- `profile-showcase`: Bookshelf tile removal confirmation copy changes.
- `works-browsing`: no-results search state gains a "217" special case.
- `short-stories-browsing`: no-results search state gains a "217" special case.
- `adaptations-browsing`: no-results search state gains a "217" special case.
- `global-search`: no-results state gains the same "217" special case (this capability landed on `main` via a separate, already-merged change after this one was proposed).
- `work-details`: Charlie the Choo-Choo page gains an author-swap detail; Misery page gains an N-glitch treatment.
- `adaptation-details`: Misery adaptation page gains an N-glitch treatment.

## Impact

- `app/components/` header/color-mode toggle, `BookshelfRemoveModal.vue`
- Sign-out flow (wherever the sign-out action currently lives, per `user-auth`)
- `app/pages/works/[slug].vue`, `app/pages/short-works/[slug].vue` (or equivalent adaptation detail route), and their existing "not found" handling
- Works, Short Stories, and Adaptations browsing pages' search/empty-state UI
- A new `app/error.vue` (or equivalent) for the shared not-found page
- A new shared composable/component for detecting and styling standalone `19`/`1999` tokens, applied broadly across rendered page text
- No database schema changes
