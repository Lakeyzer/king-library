## Why

Bibliography and adaptation data is curated by hand, and users are the first to notice when a detail is wrong or something's missing from the canonical list - but there's currently no way for them to tell us. This adds a lightweight, in-app way to report both kinds of problems without needing a github issue or an email.

## What Changes

- Add a "Report an issue" control to every content detail page (`/works/[slug]`, `/short-works/[slug]`, `/adaptations/[slug]`, `/works-by-others/[slug]`) that opens a modal for a signed-in user to describe what's wrong with that specific item.
- Add a "Report missing content" control to every content overview page (`/works`, `/short-works`, `/adaptations`, `/works-by-others`) that opens a modal for a signed-in user to describe what's missing, not tied to any single item.
- Both flows write to a new `reports` table, tagged with a `type` (`issue` vs `missing_content`) and an optional reference to the item being reported (null for missing-content reports).
- Signed-out visitors see the same controls but are directed to sign in, consistent with how other authenticated actions in the app behave (e.g. Suggestion Box).
- No admin/review UI in this change - submitted reports are queried directly (e.g. via the Supabase dashboard) for now; a review surface is a candidate follow-up change.

## Capabilities

### New Capabilities
- `content-reporting`: lets a signed-in user report an issue on a specific work/short story/adaptation/works-by-others detail page, or report missing content from any of the four overview pages, storing the report for later manual review.

### Modified Capabilities
(none - this is implemented as a self-contained, cross-cutting capability that specifies its own trigger points on each existing page, the same pattern `modal-actions` uses for footer buttons, rather than editing the requirements of `work-details`, `works-browsing`, `adaptation-details`, `adaptations-browsing`, `short-stories-browsing`, or `by-other-hands`)

## Impact

- New Supabase table `reports` + migration + RLS policies (insert-only for the owning user, no public read).
- New composable, e.g. `useReports()`, wrapping reads/writes to `reports`.
- New modal component(s) for the report-issue / report-missing-content forms.
- Touches all 8 existing page components (`app/pages/works/index.vue`, `app/pages/works/[slug].vue`, `app/pages/short-works/index.vue`, `app/pages/short-works/[slug].vue`, `app/pages/adaptations/index.vue`, `app/pages/adaptations/[slug].vue`, `app/pages/works-by-others/index.vue`, `app/pages/works-by-others/[slug].vue`) to add the relevant trigger control - no change to those pages' existing requirements.
