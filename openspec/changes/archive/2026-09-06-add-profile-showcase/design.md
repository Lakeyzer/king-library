## Context

See proposal.md - Why. The current `app/pages/profile.vue` is a single settings form (identities, visibility, delete account) and `AppHeader.vue`'s account menu only points at `/profile`. `useBooks`, `useKingWorks`, and `useAdaptations` already expose everything needed to compute progress: `king_works.dark_tower`/`bachman` flags, `user_books.owned`/`read`/`currently_reading`, and `user_adaptations.watched`. RLS on `user_books`/`user_adaptations` already allows reads "by owner or if profile public" (see `supabase/migrations/*_create_user_books_table.sql` and `*_create_user_adaptations_table.sql`), and `profiles` is readable by everyone — so the public-by-username route needs no schema or policy changes.

## Goals / Non-Goals

**Goals:**
- Make `/profile` the app's visual centerpiece: an impressive, flashy dashboard, not a form
- Reuse existing composables/RLS for both the owner's own view and the public `/profile/[username]` view, rather than building parallel data-access paths
- Keep the settings move a pure relocation — no behavior change to sign-in gating, visibility toggle, or account deletion

**Non-Goals:**
- Building the bookshelf feature itself (collection progress only teases it)
- Adaptation "currently watching" state (doesn't exist in the data model — `user_adaptations` only has `want_to_watch`/`watched`) or a currently-watching section
- Any new RLS policies or schema changes

## Decisions

**Routing: `app/pages/profile/index.vue` + `app/pages/profile/[username].vue`, settings at `app/pages/settings.vue`.**
Converts `profile.vue` from a file into a `profile/` directory. `index.vue` covers the signed-in user's own dashboard (uses `useSupabaseUser()`'s own id, no username param, redirects like the old profile page did); `[username].vue` covers the public view (looks up a profile by username, decides owner vs. visitor vs. private-notice rendering). The old `profile.vue` content moves verbatim to `settings.vue` — only its `next=/profile` redirect after OAuth linking changes to `next=/settings`, and any internal copy referring to "profile" is reworded to "settings".
_Alternative considered:_ a single `profile/[[username]].vue` (optional catch-all param) handling both cases in one file. Rejected — the two routes have different auth/redirect rules (own dashboard always requires sign-in + username; public route never requires sign-in), and folding them into one component with heavy branching is harder to reason about than two small pages sharing a dashboard component.

**One shared `ProfileShowcase` (name TBD at implementation) dashboard component, fed by a resolved profile id.**
Both pages resolve "whose dashboard is this" (own user id, or a fetched profile id by username) and then render the same dashboard component/composable calls against that id. This is what makes reusing the existing RLS-protected queries free — the queries themselves don't change based on who's viewing, only which user id they filter by.

**New composable (or extension of `useProfile`) for public profile lookup: `fetchProfileByUsername(username)`.**
Needed because `useProfile`'s current `fetchProfile` always targets the signed-in user (`user.value.sub`). The public route needs to resolve a username → profile id (and `is_public`) before it can query that profile's books/adaptations.

**Progress numbers computed client-side from existing list + user-state fetches, not new SQL views.**
`fetchKingWorks()` + `fetchUserBooks()` (or the public-profile equivalent, scoped by owner id) already return everything needed to derive the four King-work-based stats (overall, Bachman, Dark Tower, collection) and the adaptation stat by filtering/counting in the composable layer. Introducing dedicated aggregate views (like the existing `work_stats`/`adaptation_stats` per-work views) would be premature — those exist because per-work stats are queried across many users; a single profile's own totals are a handful of rows already being fetched.
_Alternative considered:_ a Postgres view/RPC that returns pre-aggregated counts per user. Rejected for now as unnecessary given the small data volumes (dozens of works/adaptations); revisit if `king_works`/`adaptations` grow enough that fetching full lists client-side becomes wasteful.

**"Flashy" is a visual/UX direction, not a spec-level requirement.**
The spec (`profile-showcase`) only commits to the numbers and sections being correct and present; the actual look (animated progress rings vs. bars, color treatment, layout density) is an implementation/`nuxt-conventions`+`nuxt-ui` concern decided at build time, using Nuxt UI primitives (progress bars, cards) rather than bespoke visual components where they fit.

## Risks / Trade-offs

- [Client-side aggregation over full `king_works`/`adaptations` lists means every showcase view fetches the full bibliography and adaptation list] → Both lists are already fetched in full elsewhere in the app (works/adaptations browse pages) with no pagination, so this matches existing scale assumptions; revisit if the bibliography grows an order of magnitude.
- [Reworking `profile.vue` → `profile/index.vue` + `profile/[username].vue` + `settings.vue` touches routing that other pages link to (`AppHeader.vue`, the OAuth-link redirect, onboarding's "no username → redirect" checks)] → All known internal links are enumerated in tasks.md; no external/bookmarked-URL compatibility concern since this is a pre-launch personal project.
- [A visitor could probe usernames at `/profile/[username]` to learn whether an account exists, even when private] → Matches existing behavior: usernames are already public (any signed-in user can be found via existing username-based flows implied by onboarding's uniqueness check), and the private-profile response already reveals only existence, not any collection data.

## Open Questions

- Exact visual treatment (progress bar vs. ring, color per category, card layout) is left to implementation — doesn't change the spec or task breakdown.
