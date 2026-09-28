## Why

Works by Others (By Other Hands) are stored in a parallel set of tables (`related_works`, `user_related_works`, `user_related_work_editions`, `related_work_omnibus_works`, `related_work_stats`) that mirror the King tables almost column for column. Every feature that touches a book has to be written twice, and components carry a `domain="king" | "related"` switch to pick which copy to talk to. It also means related works miss King features by accident rather than by choice (no reread history, no Read Again). One `works` table with a label on each row removes the duplication. Queries then decide which works each page or statistic covers.

## What Changes

- **BREAKING (schema)**: rename `king_works` to `works`. Rename every `king_work_id` foreign key column that points at it to `work_id` (`user_books`, `user_book_reads`, `user_book_editions`, `series_works`, `adaptation_works`, `king_short_story_collections`, `reports`). Also rename the `work_stats` output column. `king_work_omnibus_works` becomes `work_omnibus_works` (`omnibus_work_id`, `component_work_id`).
- Add a `kind` label to `works` (`'king'` or `'related'`). Add the related-only columns (`creator`, `category`, `relation_note`) as nullable columns on `works`, with check constraints that tie each one to its kind.
- **BREAKING (schema)**: fold the related tables into their King counterparts and drop them:
  - `related_works` into `works` (`kind = 'related'`)
  - `user_related_works` into `user_books`
  - each read in `user_related_works` becomes a logged read in `user_book_reads`
  - `user_related_work_editions` into `user_book_editions`
  - `related_work_omnibus_works` into `work_omnibus_works`
  - `related_work_stats` into `work_stats`
  - `reports.related_work_id` into `reports.work_id`

  The related omnibus triggers and functions are dropped. The King ones now cover both kinds.
- `related_work_king_works.related_work_id` and `.king_work_id` both reference `works`.
- A one-time data migration moves all existing hosted related-works data (catalog rows, user tracking, editions, reads, reports) into the merged tables, keeping every id. It runs on hosted as part of the release.
- Works by Others gain reread history and Read Again, since they now share `user_book_reads`. They still have no wishlist.
- Every read, list, and statistic is scoped by kind:
  - `/works` and `/works/[slug]` show only King works. `/works-by-others` and `/works-by-others/[slug]` show only related works. A slug of the wrong kind returns not-found.
  - Home ignores related works in the stats card (books read, books owned), the works catalog total, Most Read, Currently Being Read, Least Read, Most Wanted, Book of the Week, and Book Birthdays.
  - No recommendation ever suggests a related work: unread-because-watched, owned-unread, gift idea, unwatched adaptation, next Dark Tower book, and Dark Tower Related.
  - Profile: Overall Bibliography, Bachman, Dark Tower, and Collection ignore related works. The timeline, bookshelf, Currently Reading, and the Works by Others progress section still include them. The Read List now includes related want-to-read works.
  - The compare profiles page ignores related works completely.
  - The Dark Tower page's King progress, next-book suggestions, and `dark_tower_journey_stats` ignore related works. Its Graphic Novels list and comics progress stay as they are.
- Frontend: remove `useRelatedWorkEditions` and the `domain` prop on the book components. `useRelatedWorks` keeps only catalog reads for related works. All tracking goes through `useBooks` and `useBookshelf`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `king-works`: the canonical table becomes `works`, where each row is labelled King or related. The King fetchers and shuffle position cover only King rows.
- `by-other-hands`: works are stored as related-labelled rows in `works`. Marking read logs a read, so rereads are possible. The stats-exclusion rule is widened to home, recommendations, and the compare page. Detail URLs are scoped by kind.
- `reading-status`: Works by Others share the same reading-status controls, now including Read Again and the confirm-before-unmark flow. Wishlist is still King-only.
- `reading-timeline`: Works by Others entries are logged reads like King ones, one per read, deleted and edited the same way.
- `read-list`: the Read List shows want-to-read Works by Others too.
- `profile-showcase`: King progress indicators and recommendations exclude related works. Currently Reading uses the shared finish flow.
- `homepage`: every book statistic, leaderboard, spotlight, and recommendation excludes related works.
- `work-details`: a related work's slug returns not-found on `/works/[slug]`.
- `dark-tower-page`: King progress, suggestions, and journey stats exclude related works. The Graphic Novels definition uses the merged omnibus type.

## Impact

- **Database**: one ordered set of migrations (rename, extend, move data, drop the old tables, recreate the functions and views that reference the old names). Every plpgsql function that names `king_works` or `king_work_id` has to be recreated, because function bodies are not rewritten by a rename. Views (`work_stats`, `dark_tower_journey_stats`, `reports_public`) are recreated.
- **Hosted release**: the migration must be pushed to hosted before merging to `main`, per the release process. There is a short window where the live (old) frontend queries `king_works`/`related_works` and fails, until Vercel finishes deploying. Push and merge back to back. See design.md.
- **Seed**: `king_works.json` and `related_works.json` both load into `works`, and every row carries an explicit `kind`. `related_works.json` is reshaped to the `works` columns. `related_work_omnibus_works_seed.json` merges into the omnibus seed. The loader scripts and `package.json` seed scripts are retargeted.
- **Code**: `useBooks`, `useBookshelf`, `useKingWorks`, `useRelatedWorks`, `useHomepage`, `useAdaptations` (recommendation), `useFollowing`, `useGlobalSearch`, `useReports`, `useShortStories`, `useSeries`, the sitemap route, `app/types/database.types.ts` (regenerated), the book components (`ReadingActions`, `MarkReadModal`, `FinishReadingModal`, `StartReadingModal`, `EditionsPickerModal`, `EditionToggle`), and the profile components (`Showcase`, `ReaderChecklistTab`, `TimelineTab`, `ReadingTimeline`, `CurrentlyReading`, `BookshelfRemoveModal`), plus the Dark Tower page and `GraphicNovelList`.
- **Docs**: the `supabase-conventions` skill (schema section, triggers, stats) and CLAUDE.md's data model notes need updating to describe the single `works` table.
- **Related in-flight change**: `compare-profiles` is implemented but not archived. Its compare page is covered here by the widened by-other-hands stats-exclusion requirement, not by editing that change.
