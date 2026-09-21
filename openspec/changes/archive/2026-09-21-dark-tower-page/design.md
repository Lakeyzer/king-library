## Context

See proposal.md - Why. Relevant existing pieces this change builds on rather than duplicates:

- `series` / `series_works` (king-series capability) already store the Dark Tower series' 8 core novels with a unique `position` per work, exposed via `useSeries().fetchAllSeries()`. This is the existing canonical reading order — *The Wind Through the Keyhole* sits at position 5, between *Wizard and Glass* and *Wolves of the Calla*, reflecting its in-story chronology rather than its 2012 publish date.
- `king_works.dark_tower_relation` (a nullable text column) already exists in the schema but is `null` for every row today — no fetch selects it, and no UI reads it.
- `useBooks().fetchProfileBookStats(userId)` already computes `stats.darkTower: { count, total }` (read count over total among `dark_tower = true` works), rendered today by `ProfileProgressBar` on the profile page.
- `app/components/BibliographyBrowsePage.vue` provides the `/works`-style main+sidebar responsive split, but it's built for a searchable/filterable/sortable browse list (`flex flex-col lg:flex-row`, sidebar `lg:w-96`) — not for a small, fixed-order, non-filterable list like the Dark Tower core 8.
- `app/components/core/AppHeader.vue` holds the primary nav `links` array (`Works`, `Short Works`, `Adaptations`).

## Goals / Non-Goals

**Goals:**
- Reuse existing data (series positions, `dark_tower_relation` column, `fetchProfileBookStats`) rather than introducing new tables or duplicating the Dark Tower reading order.
- Keep the "read next" logic for the core 8 deterministic and order-aware, since a random pick would contradict the "next up" framing the user asked for.

**Non-Goals:**
- No changes to the profile page itself — the Dark Tower progress bar shown there is unaffected; this page shows the same figure, computed the same way.
- No search/filter/sort UI on this page — the core-8 and related lists are small and fixed-order/curated, unlike the Works browse page.
- No adaptations content — Dark Tower has no adaptations in the current bibliography; this page is books-only.

## Decisions

### Order the core 8 by series position, not publish date
Confirmed with the user: the main list and the "next up" suggestion both use `series_works.position` for the Dark Tower series (via `useSeries().fetchAllSeries()`), not `publish_date`. This is a deliberate divergence from a literal "order by year" reading, because the app's existing canonical order (used elsewhere, e.g. the profile bookshelf's "Group series" toggle) already places *The Wind Through the Keyhole* at position 5 to match its in-story chronology, and sorting by publish date instead would silently contradict that existing convention and put it 8th.

### Dedicated page components instead of `BibliographyBrowsePage`
`BibliographyBrowsePage` is built around search/type-filter/sort over an arbitrary-length list. The Dark Tower core-8 and related-works lists are small, fixed-membership, and have no filtering or sorting requirement — wrapping them in that component would mean disabling most of what it does. Instead, build a purpose-specific page (`app/pages/dark-tower.vue`) that reuses only the layout shape (`flex flex-col gap-4 lg:flex-row lg:items-start`, sidebar `lg:w-96 lg:shrink-0`), per `nuxt-conventions`.

### Main content presented as two `UCarousel`s, not lists
Superseded an earlier iteration that rendered the core-8 and related-works sets as `<ul>`s built on `BibliographyListItem`/`WorkTile`. Per explicit follow-up request, both sets are instead each a `UCarousel` (Nuxt UI, arrows + dots enabled) whose items share one presentational component, `DarkTowerCarouselItem.vue`: cover on the left (`ImageThumbnail` size `lg`), and on the right the title, release year, description, and — for the related-works carousel only, via an optional `note` prop — the work's `dark_tower_relation` text, with `BookReadingActions` pinned to the bottom of that column. `CoreList.vue`/`RelatedList.vue` are now thin wrappers: each owns only its `UCarousel` and which works it passes in (and, for `RelatedList`, feeding `dark_tower_relation` into `note`), while `DarkTowerCarouselItem` owns the per-item layout - reused identically by both rather than duplicated.

### `dark_tower_relation` added to `fetchKingWorks()`'s existing column list
Rather than adding a second, narrower fetch just for this page, `dark_tower_relation` is added to `KING_WORK_COLUMNS` in `useKingWorks.ts` and to the `KingWork` interface. It's one extra `text` column on a query that already runs for every visitor to `/works`, `/dark-tower`, and the homepage — negligible payload cost — and every other consumer of `fetchKingWorks()` simply ignores the new field, per `supabase-conventions`' "one composable per table."

### Related-works progress and both "read next" suggestions live in `useBooks.ts`
Like `fetchProfileBookStats`, `fetchUnreadRecommendation`, and `fetchOwnedUnreadRecommendation`, these need both `king_works` (for the related-works set and, for the core suggestion, series membership) and `user_books` (for read status) — the same cross-table shape `fetchProfileBookStats` already uses. Following that precedent, three new functions are added to `useBooks.ts`:
- `fetchDarkTowerRelatedProgress(userId): Promise<CategoryProgress>` — mirrors `fetchProfileBookStats`'s `progressFor` helper, but over works with a non-null `dark_tower_relation` instead of `dark_tower = true`.
- `fetchNextDarkTowerBook(userId): Promise<BookRecommendation-shaped | null>` — joins `fetchAllSeries()`'s Dark Tower membership with `user_books.read`, and picks the unread member with the lowest `position`. Returns `null` once all 8 are read.
- `fetchNextDarkTowerRelatedBook(userId): Promise<... | null>` — same shape as `fetchOwnedUnreadRecommendation`: filters related works to unread ones and picks randomly among them, returning `null` once all are read.

Alternative considered: extend `ProfileBookStats`/`fetchProfileBookStats` itself with a `darkTowerRelated` field. Rejected because that stat is meaningless on the general profile page (it's not shown there, and the user didn't ask for it there) — adding it to a type consumed by the profile's `ProfileShowcase.vue` would force that component to either display or explicitly ignore a field it has no use for.

### Core suggestion is deterministic; related suggestion is random
The user explicitly asked for the core-8 suggestion to respect "next up" order. The related-works suggestion has no such ordering concept (the 13 related works aren't a sequence), so it follows the app's existing pattern for undifferentiated candidate pools — `fetchUnreadRecommendation` and `fetchOwnedUnreadRecommendation` both pick randomly among qualifying candidates — for consistency rather than inventing a third selection rule.

### Progress bars reuse `ProfileProgressBar` directly
Both sidebar progress widgets pass their `{ count, total }` into the existing `app/components/profile/ProgressBar.vue` (`<ProfileProgressBar>`) with page-appropriate `label`/`icon`/`color` props, rather than building new presentational components — it already renders exactly "same as on profile," which is what was asked for.

### Related-works research: 13 works and their notes
Researched connections (excluding the 8 core novels, which are handled separately). Each note below is the `dark_tower_relation` seed value. Went through two rounds of softening after review: the first pass still stated outcomes that happen *in* the Dark Tower series (a character "crosses paths with Roland's ka-tet," an entity is confirmed as "the same" antagonist, figures "go on to play a role later" in Roland's quest) — spoilers for the Dark Tower books even when the related book's own content is fair game. The current wording sticks to naming what's already public about the related book itself (a character, a setting, a premise) and the *category* of connection (shared antagonist archetype, shared mythology, prequel, parallel world), without confirming any specific event, reappearance, or identity resolution that happens in the Dark Tower series.

| Work | Relation note |
|---|---|
| 'Salem's Lot | Jerusalem's Lot and its doomed priest, Father Callahan, belong to the same wider fictional universe as the Dark Tower series. |
| The Stand | Randall Flagg, the story's shape-shifting antagonist, is a recurring figure across King's connected multiverse, including the Dark Tower series. |
| The Eyes of the Dragon | Set generations before the Dark Tower series in the same multiverse; its antagonist is a name that echoes across King's wider mythology. |
| The Talisman | Jack Sawyer's journeys between our world and the Territories place this story within the same wider multiverse as the Dark Tower series. |
| Black House | A sequel to The Talisman that continues to draw on the same wider King multiverse as the Dark Tower series. |
| Insomnia | Set in Derry, Maine, this story touches the same wider King multiverse that the Dark Tower series draws from. |
| Rose Madder | Rosie's passage into another world through a painting places this story within the same wider multiverse as the Dark Tower series. |
| Hearts in Atlantis | Its novella "Low Men in Yellow Coats" touches the same wider King multiverse that the Dark Tower series draws from. |
| Everything's Eventual | Its novella "The Little Sisters of Eluria" is set in Roland's world, before the events of The Gunslinger. |
| IT | The great Turtle that appears in this story belongs to the same wider mythology King draws on across his connected multiverse, including the Dark Tower series. |
| Desperation | The ancient evil unearthed in this story belongs to the same wider King multiverse that the Dark Tower series draws from. |
| The Regulators | A parallel-world companion to Desperation, reflecting the same multiverse of alternate worlds King's fiction moves between. |
| Charlie the Choo-Choo | Presented within the Dark Tower series as a book that turns up along Roland's ka-tet's journey; published here as a real, readable edition of that in-story artifact. |

## Risks / Trade-offs

- **[Risk] The related-works list is a curated, human-judgment call** (which connections count as "related" vs. too tenuous to include) rather than a value derivable from existing data → Mitigation: the table above is the single source of truth for the seed values, reviewed as part of this proposal; if the user disagrees with a specific inclusion or note's wording, it's a one-line seed edit, not a re-architecture.
- **[Risk] `fetchNextDarkTowerBook` depends on `useSeries().fetchAllSeries()` returning the Dark Tower series by name** ("Dark Tower", per `series_seed.json`) rather than an id constant → Mitigation: this matches how `king-series`' own consumers already identify series (by name, since ids are seed-generated UUIDs with no stable meaning); acceptable given the series list is admin-curated and never client-writable.
- **[Trade-off] Random selection for the related-work suggestion means the same visitor may see a different suggestion on every page load** (matching existing `fetchUnreadRecommendation` behavior) rather than a stable "next" pick → acceptable since the user only specified deterministic ordering for the core-8 suggestion, not the related one.

## Migration Plan

No schema migration — `king_works.dark_tower_relation` already exists. Implementation only writes to `supabase/seed/king_works.json` (12 rows gain a `dark_tower_relation` value) and application code (composables, new page/components, nav entry). Per this project's release process, if this change ships in the same release as any *other* schema-migration work, the seed reseed still needs to go to hosted Supabase before merge to `main`; on its own, this change touches only `active`/existing-column seed values, no migration file, so it follows the "most releases won't touch seed data" branch only if the release also doesn't otherwise require a reseed — confirm at release time per the release process's seed-diff check.
