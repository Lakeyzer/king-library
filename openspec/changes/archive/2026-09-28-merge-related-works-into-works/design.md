## Context

See proposal.md for motivation. Current state that shapes the approach:

- `king_works` is seed-driven, with `type` (novel, collection, omnibus, ...), `dark_tower`, `bachman`, `dark_tower_relation`, `co_author`, `remark`, `counts_with_id`, `edition_year_min/max`, and `shuffle_position` (not null, unique, auto-assigned by `assign_shuffle_position()`). `publish_date` is not null.
- `related_works` mirrors it with `creator`, `category` (comic / reference / tie_in_novel), `relation_note`, `is_omnibus`, `dark_tower`, and a nullable `publish_date`. Every current seed row has a date, and no seed slug collides with a King slug.
- `user_related_works` is a flat copy of `user_books` without `wishlisted`/`read_year`. It adds `note`/`rating`/`format`, which describe the single most recent read, because there is no reads log. `via_omnibus_id` and the omnibus cascade/uncascade triggers are duplicated one table over.
- `user_related_work_editions` mirrors `user_book_editions`, including `unique (user_id, edition_id)`.
- `reports` has four nullable item FKs, one of them `related_work_id`. `reports_public` coalesces titles across them.
- plpgsql bodies that name `king_works` or `king_work_id`: `cascade_book_reads_on_omnibus_read`, `uncascade_book_reads_on_omnibus_unread`, `cascade_short_story_reads_on_collection_read`, `uncascade_short_story_reads_on_collection_unread`, and `assign_shuffle_position`. A table or column rename does NOT rewrite these bodies, so each one must be recreated. Views (`work_stats`, `dark_tower_journey_stats`, `reports_public`) follow a rename internally, but still expose `king_work_id` output columns and have no kind filter, so they are recreated as well.
- Hosted already has real related-works user data (see proposal). Per project memory, `supabase db reset` is never an option, locally or on hosted, so the migration must work on a populated database.

## Goals / Non-Goals

**Goals:**
- One `works` table, one per-user tracking table (`user_books`), one reads log (`user_book_reads`), one editions table, one omnibus link table, one stats view.
- A single, atomic, self-verifying migration that moves hosted data without loss and keeps every id.
- Kind scoping lives in queries (composables and views), with one obvious filter: `kind = 'king'` / `kind = 'related'`.

**Non-Goals:**
- No wishlist for related works (the column exists on `user_books`, but the UI never offers it for related works).
- No change to the following page's currently-reading sidebar. It stays King-only, as its spec says today.
- No change to short stories, adaptations, series, or suggestions beyond renaming `king_work_id` to `work_id`.
- No compatibility views or dual-write period for the old table names (see Risks).

## Decisions

### D1. Discriminator: `works.kind text not null check (kind in ('king', 'related'))`

A text column with a check constraint, matching how the project already models `category`, `type`, `format`, and `reports.status`. There is no default, so every insert (and every seed row) has to state its kind. That way a missing label fails loudly instead of silently becoming King.

- *Alternative: a Postgres enum.* Rejected: nothing else in the schema uses enums, and altering them in migrations is clumsier.
- *Alternative: a boolean `is_king`.* Rejected: the user asked for a king/related label, and a text value reads better in queries and leaves room for another kind.

### D2. Related-only columns are nullable on `works`, tied to kind by check constraints

`works` gains `creator text`, `category text check (category in ('comic', 'reference', 'tie_in_novel'))`, and `relation_note text`. One table-level constraint states the shape per kind:

- `kind = 'king'`: `type` not null, `creator`/`category`/`relation_note` null, `shuffle_position` not null.
- `kind = 'related'`: `creator` and `category` not null, `type` either null or `'omnibus'`, `shuffle_position` null.

`is_omnibus` becomes `type = 'omnibus'` for related rows. That lets the existing `cascade_book_reads_on_omnibus_read()` / `uncascade_...()` (which check `type = 'omnibus'`) cover both kinds unchanged, and the related copies are dropped. A related omnibus comic is `category = 'comic', type = 'omnibus'`, which keeps category and omnibus-ness independent, as they are today.

The King-only columns (`bachman`, `dark_tower_relation`, `co_author`, `remark`, `counts_with_id`, `edition_year_*`) simply stay null/false on related rows. `dark_tower` is shared, with the same meaning for both kinds. That is exactly why every King Dark Tower query must add `kind = 'king'` (D6).

- *Alternative: a side table `related_work_details (work_id, creator, category, relation_note)`.* Rejected: it brings back a join for three small columns, and fetchers for related works would have to embed it everywhere.

### D3. `shuffle_position` is King-only

The column becomes nullable. The per-kind check in D2 forces it not null for King and null for related. The unique constraint stays (nulls don't collide). `assign_shuffle_position()` is recreated to assign only when `new.kind = 'king'`, taking `max` over King rows. This keeps the King range contiguous, as king-works requires, and keeps related works out of the Book of the Week rotation without any client filter being load-bearing.

### D4. Rename `king_work_id` to `work_id` everywhere, including constraint and object names

Columns: `user_books`, `user_book_reads`, `user_book_editions`, `series_works`, `adaptation_works`, `king_short_story_collections`, `reports`. FK constraint names are renamed to match (e.g. `user_books_king_work_id_fkey` becomes `user_books_work_id_fkey`), because PostgREST embed hints in the composables use those names. The table-named policy, trigger, and unique constraint on `king_works` are renamed too (`works readable by everyone`, `works_assign_shuffle_position`, `works_shuffle_position_key`, `works_slug_key`, and so on).

`king_work_omnibus_works` becomes `work_omnibus_works (omnibus_work_id, component_work_id)`.

`related_work_king_works` keeps its name and its column names (`related_work_id`, `king_work_id`). Both names describe a *role* in the link, not a table. Only the `related_work_id` FK is repointed from `related_works` to `works`. The `king_work_id` FK follows the table rename automatically.

`user_short_story_reads.via_collection_id` and `user_books.via_omnibus_id` keep their names. Their FKs follow the rename.

### D5. Data mapping from the related tables

All ids are kept, so URLs, seed files, `related_work_king_works` rows, and reports keep pointing at the same rows.

| From | To | Notes |
|---|---|---|
| `related_works` row | `works` row, `kind = 'related'` | `type = case when is_omnibus then 'omnibus' end`, `shuffle_position` null |
| `related_work_omnibus_works` | `work_omnibus_works` | column rename only |
| `user_related_works` | `user_books` | `owned`, `want_to_read`, `currently_reading`, `started_on`, `read`, `finished_on`, `via_omnibus_id` copied; `wishlisted = false`; `read_year = null`; `format` copied **only when `currently_reading`** (on `user_books` it means the in-progress session's format) |
| `user_related_works` where `read and via_omnibus_id is null` | one `user_book_reads` row | `read_on = finished_on`, `started_on`, `note`, `rating`, `format`. When the row is *also* `currently_reading` (a reread in progress), `started_on` and `format` belong to the current session, so the logged read gets `started_on = null, format = null` |
| `user_related_work_editions` | `user_book_editions` | `on conflict (user_id, edition_id) do nothing`. See the pre-flight check |
| `reports.related_work_id` | `reports.work_id` | then the column is dropped and `reports_item_reference_matches_type` is recreated over three FKs |

Omnibus-cascaded reads (`via_omnibus_id` not null) get no `user_book_reads` row. That matches how the King cascade has always behaved (it only writes `user_books`), and it is what keeps cascaded components off the timeline without the special-case filter `useRelatedWorks` needs today.

### D6. Scoping lives in queries, backed by `kind` on `work_stats`

- `work_stats` is recreated with `work_id` and a `kind` output column, so stat consumers can filter without a join. `related_work_stats` is dropped. A related work's detail page reads `work_stats` by `work_id`.
- `dark_tower_journey_stats` is recreated with `k.kind = 'king'` in both CTEs.
- Every King-scoped composable query adds `.eq('kind', 'king')` on `works` (directly, or via `!inner` embed filters on `user_books` queries). Every related-scoped query adds `.eq('kind', 'related')`.
- Queries that intentionally cover both kinds select `kind` so the UI can build the right link: the profile timeline, bookshelf, Currently Reading, read list, and the user's own `userBooksByWorkId`.

A single helper, `workPath(kind, slug)`, returns `/works/<slug>` or `/works-by-others/<slug>` and replaces the per-domain link logic in the profile components.

- *Alternative: separate `king_works` / `related_works` views over `works`.* Rejected: the user explicitly wants queries to do the scoping. Views would also reintroduce two names for one thing, and would need their own grants.

### D7. Composables collapse onto `useBooks` / `useBookshelf`

- `useBooks` tracking methods (`setOwned`, `toggleWantToRead`, `startReading`, `stopReading`, `finishReading`, `markRead`, `readAgain`, `unmarkRead`, read-edit/delete) become kind-agnostic. They already operate by work id. `userBooksByWorkId` holds both kinds.
- `useBookshelf` covers both kinds' editions. `useRelatedWorkEditions` is deleted.
- `useRelatedWorks` keeps only catalog reads scoped to `kind = 'related'`: list, by-slug, omnibus components, omnibus groups, links to and from King works, and the Works by Others profile progress (now read from `user_books`). It maps `type === 'omnibus'` to the existing `is_omnibus` field on its `RelatedWork` interface, so page and component templates barely change.
- The book components' `domain` prop is replaced by `kind?: 'king' | 'related'` (default `'king'`). Its only remaining job is hiding wishlist controls for related works. Nothing chooses a storage backend by kind any more.
- The profile components drop the parallel `related*` props and merge computeds. The single fetches now return both kinds.

### D8. One migration file, self-verifying, atomic

The whole change is a single migration file, applied as one transaction. It runs these sections in order:

1. Renames.
2. `works` columns and constraints.
3. Copy the related rows.
4. Copy the user data.
5. Reports.
6. Repoint `related_work_king_works`.
7. Recreate the functions, views, and triggers.
8. **Verification block**: a `do $$ ... $$` block compares counts between the old tables and their new targets (related works, user rows, reads to log, editions minus the known conflicts, reports) and `raise exception` on any mismatch.
9. Drop the old tables, functions, and views.

If anything fails, including the count checks, hosted is left exactly as it was.

- *Alternative: several smaller migrations.* Rejected: a partial apply on hosted (for example, tables dropped but functions not yet recreated) is far worse than one big file. The file stays readable through commented sections.

### D9. Seed files follow the merged shape

- `king_works.json`: every row gains `"kind": "king"`.
- `related_works.json` is reshaped to `works` columns: `kind: "related"`, `is_omnibus` becomes `type`, and there is no `shuffle_position`.
- `king_work_omnibus_works_seed.json` and `related_work_omnibus_works_seed.json` merge into `work_omnibus_works_seed.json` with the renamed columns.
- Seeds with a `king_work_id` key (`adaptation_works`, `series_works`, `king_short_story_collections`) are renamed to `work_id`.
- The loaders target `works` and `work_omnibus_works`, in this order: King works, related works, omnibus links, then `related_work_king_works`.

## Risks / Trade-offs

- **Old frontend breaks between `db push` and the Vercel deploy finishing.** The live app queries `king_works`, `related_works`, and `user_related_works`, which no longer exist. → Push and merge back to back, so the window is Vercel's build time (a few minutes). Release at a quiet time. Compatibility views were considered and rejected: writes to `user_related_works` would still fail, so they only half-cover the window, and they add objects to clean up later.
- **Hosted data violates a new constraint** (a related work with null `publish_date`, a slug shared by a King and a related work) → The migration aborts and hosted is unchanged. Run the read-only pre-flight queries in tasks.md against hosted first, and fix the data through the seed if needed.
- **Edition id collision**: one user has the same Open Library edition on both a King work and a related work, which violates `unique (user_id, edition_id)` → The pre-flight query counts these. The migration skips them (`do nothing`), and the verification block allows exactly that count. If it is non-zero, decide per case before release.
- **A missed King-scoped query quietly starts counting related works** (the most likely regression) → tasks.md lists every query from the audit. Also, after the change, grep for `.from('works')` and `.from('user_books')` / `.from('user_book_reads')` / `.from('work_stats')` calls that have no kind filter and no comment saying both kinds are intended.
- **Behavior change for existing related reads**: each read becomes a logged read, so unmarking now asks for confirmation and deletes logged reads. This is intended (see the specs). Notes and ratings survive on the logged read.
- **No automatic rollback.** → Before `db push`, take a data-only dump of the affected hosted tables (`king_works`, `related_works`, `user_books`, `user_book_reads`, `user_book_editions`, `user_related_works`, `user_related_work_editions`, `related_work_omnibus_works`, `king_work_omnibus_works`, `reports`) with `supabase db dump --data-only`. A rollback is a hand-written reverse migration restored from that dump. It is only needed if a post-release problem is found. A failed apply rolls itself back.

## Migration Plan

1. **Local**: apply the migration with `supabase migration up` against the local database, after seeding it with related-works user data that covers every mapping row in D5 (owned-only, want-to-read, currently-reading, read with note/rating/format, read and currently-reading, omnibus-cascaded, editions, a report). Never use `db reset`. Reseed locally, regenerate types, and test by hand.
2. **Hosted pre-flight** (read-only, with the user's go-ahead): run the checks in tasks.md. Resolve any hits.
3. **Release** (per CLAUDE.md "Release process", with an explicit go-ahead for each hosted write): take the data-only backup, `supabase db push`, check the migration's verification passed and spot-check a few users, reseed hosted from the updated seed files (idempotent upsert by id, which confirms seed and hosted agree), bump the version, merge to `main`, and tag.
4. **Post-release**: open `/works`, `/works-by-others`, a related work's detail page, a profile with related reads, and the home page. Confirm the counts match the pre-release figures for King-only stats.
