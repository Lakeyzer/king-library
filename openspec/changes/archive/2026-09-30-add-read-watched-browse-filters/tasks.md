## 1. Shared browse component

- [x] 1.1 Add the optional `statusFilter` prop (`doneLabel`, `notDoneLabel`, `isDone`) to `app/components/BibliographyBrowsePage.vue`, with a `ref<'all' | 'done' | 'notDone'>('all')` and options built from the labels; verify `pnpm typecheck` passes
- [x] 1.2 Fold the status check into the existing `filteredItems` predicate (only when the prop is set and the selection isn't `'all'`); verify by reading the computed that search, type, `extraFilter`, and status all AND together and the "No matches" empty state still triggers
- [x] 1.3 Render a `USelect` for the status filter (icon + `aria-label`) at the start of the sort row (ahead of the sort field and direction button), only when `statusFilter` is set; verify pages that don't pass the prop render unchanged
- [x] 1.4 Watch the `statusFilter` prop and reset the selection to `'all'` when it becomes undefined (sign-out); verify no status restriction remains after signing out on a filtered page

## 2. Wire up the four pages

- [x] 2.1 `/works` (`app/pages/works/index.vue`): pass `statusFilter` with "Read"/"Unread" and `isDone` from `userBooksByWorkId[item.id]?.read`, only when `useSupabaseUser()` is set; verify signed-in "Read" shows only read King works and "Unread" includes currently-reading/want-to-read works
- [x] 2.2 `/works-by-others` (`app/pages/works-by-others/index.vue`): same as 2.1 with the page's mapped items; verify it combines with the category dropdown
- [x] 2.3 `/short-works` (`app/pages/short-works/index.vue`): pass "Read"/"Unread" with `isDone` from `readShortStoryIds[item.id]`, signed-in only; verify it combines with "Not in a collection"
- [x] 2.4 `/adaptations` (`app/pages/adaptations/index.vue`): pass "Watched"/"Unwatched" with `isDone` from `userAdaptationsByAdaptationId[item.id]?.watched`, signed-in only; verify watchlist-only adaptations appear under "Unwatched"

## 3. Checks and hand-off

- [x] 3.1 Run `pnpm lint` and `pnpm typecheck`; verify both pass with no new errors, and grep the diff for em dashes (none allowed)
- [x] 3.2 Report ready for manual testing (do not start the dev server): each page signed in and signed out, filter defaults to "All" on load, marking an item read/watched under "Unread"/"Unwatched" removes it from the list, and the filter row wraps cleanly at phone width
