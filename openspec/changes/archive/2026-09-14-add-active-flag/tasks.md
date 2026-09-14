## 1. Schema

- [x] 1.1 Add a Supabase migration adding `active boolean not null default true` to `king_works` and to `adaptations`, and verify it applies cleanly against a local Supabase instance
- [ ] 1.2 Push the migration to hosted Supabase before merging (per this project's release process), and verify the columns exist on the hosted `king_works` and `adaptations` tables — deliberately left for the release step: pushing to hosted needs an explicit go-ahead per this project's Supabase workflow, not implied by implementing the feature
- [x] 1.3 Update `supabase/seed/*.json` to include `active: true` on existing King works and adaptations entries, and verify a fresh local seed load succeeds

## 2. Composable read paths

- [x] 2.1 Update `useBooks`' fetch-all-for-display and fetch-by-slug queries to filter `active = true` (by-slug: no match on an inactive row), and verify with a manual query against a King work flipped to inactive
- [x] 2.2 Update `useAdaptations`' fetch-all-for-display and fetch-by-slug queries to filter `active = true` (by-slug: no match on an inactive row), and verify with a manual query against an adaptation flipped to inactive
- [x] 2.3 Update the work→adaptations and adaptation→works "based on"/"connected" join queries to filter `active = true` on the joined side, and verify an inactive linked item drops out of both directions
- [x] 2.4 Update every `user_books`/`user_adaptations` aggregate query (stats card, leaderboards, spotlights, progress bars, recommendations) to only count rows joined to an active King work or active adaptation, and verify by flipping a work/adaptation with existing history to inactive and confirming its counts disappear

## 3. Works & adaptations browsing and details

- [ ] 3.1 Confirm the works browsing page shows no inactive King works, using the updated `useBooks` list query — manual check: mark a work inactive and reload `/works` (data-layer behavior already verified directly against Supabase; page-level check needs the dev server, left for manual testing)
- [ ] 3.2 Confirm the adaptations browsing page shows no inactive adaptations, using the updated `useAdaptations` list query — manual check: mark an adaptation inactive and reload `/adaptations` (data-layer behavior already verified directly against Supabase; page-level check needs the dev server, left for manual testing)
- [ ] 3.3 Confirm navigating to an inactive work's or adaptation's detail-page slug renders the not-found page, not a detail page (data-layer behavior already verified directly against Supabase — by-slug fetch returns null for an inactive row, which both detail pages already treat as a 404; page-level check needs the dev server, left for manual testing)
- [ ] 3.4 Confirm a work's detail page omits an inactive linked adaptation from "connected adaptations", and an adaptation's detail page omits an inactive linked King work from "based on" (data-layer behavior already verified directly against Supabase for both directions; page-level check needs the dev server, left for manual testing)

## 4. Global search

- [x] 4.1 Update the global search query (or its client-side filter) to exclude inactive King works and inactive adaptations, and verify a query matching only an inactive item's title returns no result for it (short stories unaffected) — inherited for free from `useKingWorks().fetchKingWorks()`/`useAdaptations().fetchAdaptations()`, which `useGlobalSearch()` already calls

## 5. Homepage

- [x] 5.1 Update the catalog links totals to count only active King works and active adaptations
- [x] 5.2 Update the stats card's books-read, books-owned, and adaptations-watched counts to only include rows tied to an active King work/adaptation
- [x] 5.3 Update the Book of the week selection to compute the ISO-week rotation over the active-works subset (nth-lowest shuffle position among active works, n = week mod count of active works), and verify no inactive work is ever selected
- [x] 5.4 Update Book birthday to only match active King works
- [x] 5.5 Update the Most Read and Currently Being Read leaderboards to only rank active King works
- [x] 5.6 Update the Least Read and Most Wanted book spotlights to only consider active King works
- [x] 5.7 Update the Most Watched and Least Watched adaptation leaderboards to only rank active adaptations
- [x] 5.8 Update the Most Anticipated adaptation spotlight to only consider active adaptations
- [x] 5.9 Update the three personalized recommendation queries (book-via-watched-adaptation, owned-unread book, adaptation-via-read-work) to require every King work and adaptation involved to be active
- [ ] 5.10 Manually verify: mark a work/adaptation with existing user data inactive, reload the homepage, and confirm it no longer appears anywhere on the page — needs the dev server, left for manual testing per this project's testing workflow

## 6. Profile showcase, Read List, Watch List

- [x] 6.1 Update the overall/Bachman/Dark Tower reading-progress queries to exclude inactive King works from both the read count and the total
- [x] 6.2 Update the adaptation viewing-progress query to exclude inactive adaptations from both the watched count and the total
- [x] 6.3 Update the Currently Reading query to exclude inactive King works
- [x] 6.4 Update the collection-progress (owned count/total) query to exclude inactive King works
- [x] 6.5 Update the Bookshelf tile query (editions + edition-less owned works) to exclude inactive King works
- [x] 6.6 Update the owned-unread and gift-idea recommendation queries to exclude inactive King works
- [x] 6.7 Update the Read List query to exclude inactive King works, and the Watch List query to exclude inactive adaptations
- [x] 6.7a (added during implementation, beyond the original task list — see completion notes) Update `fetchReadingTimeline` to exclude inactive King works, matching the original request's explicit mention of the profile "timeline"
- [ ] 6.8 Manually verify: on a profile with an inactive work/adaptation in its history, confirm it's absent from progress bars, Currently Reading, Bookshelf, recommendations, Read List, and Watch List — needs the dev server, left for manual testing per this project's testing workflow

## 7. Regression check

- [ ] 7.1 Confirm all of the above with `active` left at its default `true` produces no visible change for any existing work/adaptation (default-true regression check across works/adaptations browsing, details, homepage, search, and profile) — needs the dev server, left for manual testing per this project's testing workflow
