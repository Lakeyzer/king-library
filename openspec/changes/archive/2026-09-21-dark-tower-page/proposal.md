## Why

Dark Tower is the spine of Stephen King's bibliography, but today the only way to find the eight core novels is filtering the general Works page, and there is no page at all for the wider constellation of Dark Tower-connected books (*'Salem's Lot*, *The Stand*, *Insomnia*, *Hearts in Atlantis*, and others). A dedicated Dark Tower page gives fans a curated home for the series and its connected works, and surfaces personalized reading progress and "read next" nudges scoped to just that corner of the bibliography.

## What Changes

- Add a new `/dark-tower` page laid out like `/works` (main content area + right sidebar), reusing `BibliographyBrowsePage`'s main+sidebar split convention but with curated, non-searchable content rather than a filterable browse list.
- Main area: the 8 core Dark Tower novels in canonical reading order (via the existing `series`/`series_works` data, not publish date — this correctly places *The Wind Through the Keyhole* 5th, between *Wizard and Glass* and *Wolves of the Calla*, matching its in-story chronology rather than its 2012 publish date).
- Main area: a "Related Works" list of King works connected to the Dark Tower mythos without being core entries, sourced from `king_works.dark_tower_relation`. Research and populate this note for 13 works: *'Salem's Lot*, *The Stand*, *The Eyes of the Dragon*, *The Talisman*, *Black House*, *Insomnia*, *Rose Madder*, *Hearts in Atlantis*, *Everything's Eventual*, *IT*, *Desperation*, *The Regulators*, and *Charlie the Choo-Choo* (exact copy in design.md).
- Sidebar (signed-in only): Dark Tower reading progress, reusing the existing `stats.darkTower` category progress and `ProfileProgressBar` component already shown on the profile page — same data, same visual, just relocated to this page.
- Sidebar (signed-in only): a new "Dark Tower Related" reading progress bar, a new category (count/total read among the 13 related works) not currently computed anywhere.
- Sidebar (signed-in only): a "read next" Dark Tower suggestion when the user hasn't read all 8 core books — the lowest-series-position unread book, not a random pick (unlike the app's other recommendation widgets), so it always points at the next book in reading order.
- Sidebar (signed-in only): a "read next" Dark Tower Related suggestion when the user hasn't read all 13 related works — a random pick among unread related works, consistent with the app's existing recommendation widgets (`WorkRecommendation`, `WorkOwnedRecommendation`).
- Extend `useKingWorks().fetchKingWorks()` to also return `dark_tower_relation`, since no existing fetch exposes it to application code today.
- Add a `dark-tower` entry to primary navigation.

## Capabilities

### New Capabilities
- `dark-tower-page`: the `/dark-tower` page itself — the core-8 list in series order, the related-works list, and the four signed-in-only sidebar widgets (two progress bars, two "read next" suggestions).

### Modified Capabilities
- `king-works`: "Retrieve all King works for display" must also return `dark_tower_relation` (currently omitted from `fetchKingWorks()`'s column list); the seed-data requirement's scenario for *'Salem's Lot* currently asserts it has "no Dark Tower relation note" — this is no longer true once its relation note is populated, so that scenario is corrected; a new seed-data requirement documents the 13 works' relation notes.

## Impact

- **New**: `app/pages/dark-tower.vue`, a handful of `app/components/darkTower/*.vue` components (core-list item, related-list item, the two progress bars reusing `ProfileProgressBar`, the two suggestion cards).
- **Modified**: `app/composables/useKingWorks.ts` (add `dark_tower_relation` to `KING_WORK_COLUMNS`/`KingWork`), `app/composables/useBooks.ts` (new fetch functions for the related-works progress stat and the two "read next" suggestions), `supabase/seed/king_works.json` (13 `dark_tower_relation` values), navigation config (new nav entry).
- **No schema migration** — `king_works.dark_tower_relation` already exists as a nullable text column; this change only populates seed data for it.
