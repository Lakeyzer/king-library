## Why

Right now the only way to see how your King reading stacks up against a friend's is to open both profiles in separate tabs and eyeball the numbers. A side-by-side comparison view turns that into a single glanceable page, and gives users a reason to visit each other's profiles beyond following.

## What Changes

- Add a new route `/profile/[username]/compare` that compares the signed-in visitor's own profile against the profile at `[username]`.
- Add a "Compare" button to a profile's header, shown to a signed-in visitor viewing someone else's profile, linking to that profile's compare route.
- The compare page shows, for each reading-progress category (Overall Bibliography, Bachman Books, Dark Tower, Collection) and for adaptation viewing progress, both users' progress side by side.
- The compare page shows two book-diff lists: King works the signed-in visitor has read that the other user hasn't, and vice versa.
- The compare page shows two adaptation-diff lists: adaptations the signed-in visitor has watched that the other user hasn't, and vice versa.
- Each comparison block (a progress category, or a diff-list pair) lays out its two sides as a row on large screens and stacks them into a column on small screens, and only one block is ever laid out side-by-side at a time (no single wide multi-column table).
- Comparing requires sign-in (there is no "your side" without a signed-in profile) and follows the same privacy gating as every other profile route: a private profile involved in the comparison (either side) shows a private-profile state instead of its data, unless the viewer is that profile's own owner.

## Capabilities

### New Capabilities
- `profile-compare`: A route that compares the signed-in user's reading/viewing progress and read/watched works against another user's, side by side.

### Modified Capabilities
- `profile-showcase`: The showcase header gains a "Compare" control, shown to a signed-in visitor viewing another user's profile, alongside the existing share/follow control.

## Impact

- New page: `app/pages/profile/[username]/compare.vue`.
- New component(s) under `app/components/profile/` for the compare layout (progress-category comparison rows, read/watched diff-list rows).
- `app/components/profile/Header.vue`: add the Compare button/link for signed-in non-owner visitors.
- `composables/useBooks.ts` and `composables/useAdaptations.ts`: add fetchers for two-user diffing (read-by-one-not-other, watched-by-one-not-other), reusing existing `user_books`/`user_adaptations` RLS.
- No schema changes — comparison is computed client-side from existing `king_works`, `user_books`, `adaptations`, and `user_adaptations` data, same pattern as the existing showcase stats.
