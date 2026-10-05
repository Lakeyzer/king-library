## Context

All four browse pages (`/works`, `/works-by-others`, `/short-works`, `/adaptations`) render through `BibliographyBrowsePage.vue`, which owns the title search, the type dropdown, sorting, and the empty states, and exposes an `extraFilter` predicate plus an `extra-filters` slot for page-specific filters (the Bachman/Dark Tower radio on `/works`, the "Not in a collection" checkbox on `/short-works`).

Each page already loads the signed-in user's status into shared `useState` stores so its action buttons can render:

- `/works`, `/works-by-others` - `useBooks().userBooksByWorkId` (`UserBook.read`)
- `/short-works` - `useShortStories().readShortStoryIds`
- `/adaptations` - `useAdaptations().userAdaptationsByAdaptationId` (`UserAdaptation.watched`)

These stores are updated in place when the user marks something read/watched, so a filter computed from them stays reactive without refetching.

## Goals / Non-Goals

**Goals:**
- One status-filter control, implemented once in `BibliographyBrowsePage`, with identical placement and behavior on all four pages.
- Zero new Supabase queries - filter purely over already-loaded state.

**Non-Goals:**
- Filtering by other statuses (owned, wishlist, want to read, currently reading, watchlist). The suggestion asked for read/watched only; the tri-state control leaves room to add options later.
- Persisting the selection across page loads or syncing it to the URL query string. No other browse filter does either today.
- Adding the filter to the Dark Tower page, profile bookshelf, or Read List.

## Decisions

### Tri-state "All / Read / Unread" select rather than a single "Hide read" checkbox
A tri-state select answers both "what have I read?" and "what's left?", and matches the existing type dropdown visually. The labels come from the page: "Read"/"Unread" for books and short stories, "Watched"/"Unwatched" for adaptations. Alternative considered: a checkbox like "Not in a collection" - rejected because it only covers one direction.

### A generic `statusFilter` prop on `BibliographyBrowsePage`, not per-page `extraFilter` logic
Add an optional prop along the lines of:

```ts
statusFilter?: {
  doneLabel: string      // 'Read' | 'Watched'
  notDoneLabel: string   // 'Unread' | 'Unwatched'
  isDone: (item: T) => boolean
}
```

The component owns the `ref<'all' | 'done' | 'notDone'>('all')`, renders a `USelect` (icon e.g. `i-lucide-circle-check`, `aria-label` "Read status" / "Watched status") next to the type dropdown, and adds the check to the existing `filteredItems` predicate. Alternative considered: each page adds its own control in the `extra-filters` slot and folds it into `extraFilter` - rejected because it duplicates the same control four times and `/works` and `/short-works` already use `extraFilter` for something else.

### Signed-in gating lives in the page, not the component
Pages pass `:status-filter="user ? {...} : undefined"` using `useSupabaseUser()` (all four already have or can cheaply take it). `BibliographyBrowsePage` stays free of auth concerns: no prop, no control, no filtering. The component watches the prop and resets its selection to `'all'` when the prop goes away, so signing out never leaves a hidden filter applied.

### Predicates per page
- `/works`, `/works-by-others`: `item => !!userBooksByWorkId.value[item.id]?.read`
- `/short-works`: `item => !!readShortStoryIds.value[item.id]`
- `/adaptations`: `item => !!userAdaptationsByAdaptationId.value[item.id]?.watched`

A missing row means "not read/watched". "Currently reading", "want to read", owned-but-unread and watchlist all count as not done, per the specs.

### Layout
The status select sits at the start of the sort row, ahead of the sort field and direction button (which stay tightly grouped), rather than in the search/type row - keeping the search input from being squeezed. The row renders when either sorting or the status filter is enabled, so a page with `showSort: false` can still show the status filter. Follow `nuxt-conventions` / Nuxt UI `USelect` sizing already used by the type filter.

## Risks / Trade-offs

- [User status loads unawaited, after the list renders] → Default is "All", so nothing is filtered until the user picks an option; by then the status fetch has almost always resolved. If it hasn't, the list simply updates reactively when it does.
- [Items vanish immediately when marked read under "Unread"] → Intended (spec'd) behavior; it's what "filter to unread" means. The action happens in a popover/modal on the row, so the row disappearing after the action completes is acceptable.
- [Adding a third control to a crowded filter row] → Handled by letting the row wrap; verify at phone width during manual testing.

## Migration Plan

Front-end only. No schema, RLS, or seed changes, so no hosted Supabase step before merge. Rollback is a revert.
