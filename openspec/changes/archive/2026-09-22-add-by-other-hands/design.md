## Context

See proposal.md - Why. This touches the data model (two new tables), a new page, and the statistics layer's invariant that only `king_works`/`user_books` (and the short-story equivalents) feed King completion numbers - see `supabase-conventions` "Statistics: query live, don't store counters" and "Reading progress by category". The safest way to guarantee the exclusion requirement in the spec is structural, not a filter someone has to remember to add: put By Other Hands data in tables that `work_stats`, `bibliography_items`, and `user_read_items` never reference.

## Goals / Non-Goals

**Goals:**
- Reuse the existing `king_works`/`user_books` pattern (seed-file-driven canonical table + per-user join table + RLS + triggers) for a second, parallel domain, rather than inventing a new modeling style.
- Make the King-stats exclusion true by construction, not by a query-time filter.

**Non-Goals:**
- Full reread history (a `user_related_work_reads` table mirroring `user_book_reads`, logging every distinct read as its own row) - out of scope; `user_related_works` holds one current read state per work, same shape as `user_books` before `user_book_reads` was added. It does now carry a `note` and `rating` for that one current read (added in a later revision - see schema below), but a reread simply overwrites them rather than logging a new entry. (Edition-level tracking, originally listed as a non-goal here too, was added in a later revision pass of this change - see the `user_related_work_editions` schema and decisions below.)
- Any cross-reference from a By Other Hands work back to a specific `king_works` row (e.g. "this graphic novel adapts this section of the core series"). The spec's "connection note" is free text, not a structured link. Nothing in the ask requires navigating from a King work to its By Other Hands material or vice versa, and adding a nullable FK now would be schema surface with no requirement driving it.
- A wishlist state for By Other Hands works - only owned and reading-progress states apply. (Corrected after initial implementation: the first pass mirrored `user_books.wishlisted`, but King books' own wishlist column has no UI anywhere in the app either - it was schema-only tech debt, not a pattern worth propagating into a new feature.)

## Decisions

**Two new tables, `related_works` and `user_related_works`, structurally identical in pattern to `king_works`/`user_books`.**

`related_works` (seed-file-driven, read-only at runtime, public read RLS):

| column           | type                      | notes                                                                 |
| ---------------- | ------------------------- | ---------------------------------------------------------------------- |
| `id`              | uuid, PK                  |                                                                        |
| `title`           | text                      |                                                                        |
| `creator`         | text                      | author(s)/artist(s) - who actually wrote/drew it, since it isn't King |
| `category`        | text                      | one of `comic`, `reference`, `tie_in_novel` (check constraint)        |
| `publish_date`    | date, nullable            | some reference/companion material has no clean single publish date    |
| `slug`            | text, unique              | same kebab-case convention as `king_works.slug`                       |
| `open_library_work_key` | text, nullable      | for cover backfill, same purpose as on `king_works`                   |
| `cover_id`        | integer, nullable         | same one-off-backfill-to-seed-file pattern as `king_works.cover_id`, for the browsing page thumbnail |
| `description`     | text, nullable            |                                                                        |
| `relation_note`   | text, nullable            | free-text connection to King's work (the spec's "connection note")    |
| `active`          | boolean, default `true`   | same purpose as `king_works.active`                                   |
| `is_omnibus`      | boolean, default `false`  | same overloaded-flag purpose as `king_works.type = 'omnibus'` - true for a row that collects other `related_works` rows (see `related_work_omnibus_works` below) rather than being independently-authored content of its own. Orthogonal to `category`: an omnibus of comics is still `category = 'comic'`. |

`related_work_omnibus_works` (seed-file-driven, mirrors `king_work_omnibus_works`):

| column                       | type                           | notes |
| ----------------------------- | ------------------------------ | ----- |
| `id`                          | uuid, PK                       |       |
| `omnibus_related_work_id`     | uuid, FK → `related_works.id`  |       |
| `component_related_work_id`   | uuid, FK → `related_works.id`  |       |

Unique constraint on `(omnibus_related_work_id, component_related_work_id)`. Public-read RLS, no write policy - seed-file-only, same as `king_work_omnibus_works`.

`user_related_works` (per-user tracking, same RLS shape as `user_books`):

| column              | type                            | notes                                            |
| ------------------- | -------------------------------- | ------------------------------------------------- |
| `id`                | uuid, PK                        |                                                   |
| `user_id`           | uuid, FK → `auth.users.id`      |                                                   |
| `related_work_id`   | uuid, FK → `related_works.id`   |                                                   |
| `owned`             | boolean, default `false`        |                                                   |
| `want_to_read`      | boolean, default `false`        |                                                   |
| `currently_reading` | boolean, default `false`        |                                                   |
| `started_on`        | date, nullable                  |                                                   |
| `read`              | boolean, default `false`        |                                                   |
| `finished_on`       | date, nullable                  |                                                   |
| `via_omnibus_id`    | uuid, nullable, FK → `related_works.id`, `on delete set null` | mirrors `user_books.via_omnibus_id` - which omnibus's read-cascade (if any) marked this row read, so the uncascade trigger can leave a directly-read (or differently-cascaded) row alone |
| `note`              | text, nullable, `check (char_length(note) <= 200)` | describes the current/most-recent read only - see Non-Goals |
| `rating`            | integer, nullable, `check (rating between 1 and 5)` | same scope as `note` |

No `wishlisted` column - see Non-Goals above. Unique constraint on `(user_id, related_work_id)`. Same four-policy owner-or-public-profile RLS as `user_books`.

`user_related_work_editions` (optional detail: specific copies of an owned work, mirrors `user_book_editions`):

| column           | type                          | notes |
| ----------------- | ------------------------------ | ----- |
| `id`              | uuid, PK                       |       |
| `user_id`         | uuid, FK → `auth.users.id`     |       |
| `related_work_id` | uuid, FK → `related_works.id`  |       |
| `edition_id`      | text                            | Open Library edition key, same as `user_book_editions.edition_id` |
| `edition_title`   | text                            | denormalized title snapshot |
| `added_at`        | timestamptz, default `now()`   |       |

Unique constraint on `(user_id, edition_id)`. Same four-policy owner-or-public-profile RLS as `user_books`/`user_book_editions`. Never determines ownership on its own - `user_related_works.owned` is always the source of truth, same rule as `user_book_editions`.

`related_work_stats` (view, mirrors `work_stats`, scoped entirely to By Other Hands data):

```sql
create view related_work_stats as
select
  r.id as related_work_id,
  count(*) filter (where urw.want_to_read) as want_to_read_count,
  count(*) filter (where urw.currently_reading) as currently_reading_count,
  count(*) filter (where urw.read) as read_count,
  count(*) filter (where urw.owned) as owner_count
from related_works r
left join user_related_works urw on urw.related_work_id = r.id
group by r.id;
```

Never joins `king_works`/`user_books` - this is a per-By-Other-Hands-work stat (like "12 people own this comic"), not a King stat, so it's additional surface, not something the King-stats-exclusion requirement applies to.

**Why not fold these into `king_works`/`user_books` with a discriminator column (e.g. `is_king_work`)?** That's the alternative that was considered and rejected. It would need every existing King-stats query (`work_stats`, `bibliography_items`, the Dark Tower/Bachman completion queries, every leaderboard) to be audited and given a `where is_king_work = true` guard, and any future stats query written without knowing that convention would silently include By Other Hands rows. A separate table makes the exclusion the default - a stats query would have to deliberately join in `user_related_works` to leak this data, not deliberately filter it out.

**Reuse the existing `clear_read_states_on_progress()` trigger function on the new table, rather than writing a near-duplicate one.** It references its columns generically (`new.want_to_read`, `new.currently_reading`, `new.read`) with no table-specific logic, and `user_related_works` uses the identical column names. One new `create trigger ... execute function clear_read_states_on_progress()` statement on `user_related_works` gets the same invariant with zero new PL/pgSQL. (`clear_wishlist_on_owned()` is not attached here - no wishlist column exists to clear.)

**Omnibus support mirrors `king_work_omnibus_works`'s table-plus-two-triggers shape exactly, one domain over - not reused directly.** The cascade/uncascade trigger *functions* (`cascade_book_reads_on_omnibus_read()` etc.) can't be reused as-is the way `clear_read_states_on_progress()` was: they hardcode `king_works`/`user_books` table names and the `type = 'omnibus'` check inside their SQL body, so a `related_works`/`user_related_works` equivalent needs its own function pair (`cascade_related_work_reads_on_omnibus_read()` / `uncascade_related_work_reads_on_omnibus_unread()`), copied from the King versions with table/column names swapped and `type = 'omnibus'` replaced by `is_omnibus = true`. This keeps the exclusion-from-King-stats property intact (see the "why not fold these into king_works/user_books" decision above) while giving By Other Hands omnibuses (e.g. "Stephen King's The Dark Tower: Beginnings", collecting five individually-published comics) the same one-action-marks-everything-inside behavior King omnibuses already have.

**Detail page reuses the `detail` layout and `DetailHero`/`DetailConnectionList` components King works already use**, rather than inventing new chrome - same "Contains" pattern King omnibuses use for their component works, applied to `related_work_omnibus_works` instead of `king_work_omnibus_works`. See the page-routing decision below for where it lives.

**Category is a fixed three-value `check` constraint (`comic` / `reference` / `tie_in_novel`), not a separate lookup table.** The spec fixes the set at exactly three categories; a lookup table would be justified if categories were user-managed or expected to grow arbitrarily, neither of which applies here (same reasoning `supabase-conventions` gives for typed status values over bare strings).

**Composable: one new `useRelatedWorks()`, following the existing one-composable-per-domain convention.** Wraps reads against `related_works` and read/write against `user_related_works` - the same split `useBooks()` draws for `king_works`/`user_books`. No existing composable is touched.

**Editions reuse `useOpenLibraryEditions()` unmodified**, since it already takes a bare Open Library work key and has no King-specific assumptions - the same live-fetch, no-persisted-cache approach `book-collection` uses. A new `useRelatedWorkEditions()` composable mirrors `useBookshelf()` one domain over (its own `user_related_work_editions` table, its own `addEdition`/`removeEdition` two-write pattern that calls `useRelatedWorks().setOwned()` for the ownership half - never writing `user_related_works` directly), and `ByOtherHandsEditionList.vue` / `ByOtherHandsEditionsPickerModal.vue` / `ByOtherHandsEditionToggle.vue` mirror `WorkEditionList.vue` / `BookEditionsPickerModal.vue` / `BookEditionToggle.vue` structurally. The Add to Shelf control opens this picker when a work has an Open Library work key, falling back to a plain owned toggle when it doesn't (defensive - every currently-seeded work has a key, but nothing guarantees a future one will).

**Actions component gets an `expanded` mode mirroring `BookReadingActions`, trimmed for the narrower state machine.** `ByOtherHandsActions.vue` keeps its existing compact dropdown (list page) and adds a second, button-per-action layout (detail page) matching `BookReadingActions`' leftmost/start-finish/read/shelf slot structure: leftmost (readlist toggle, or "Mark as Unread" once read), start/finish, a dedicated "Mark as Read" slot (shown whenever the work isn't currently-reading and isn't already read - the first implementation dropped this slot entirely, leaving no way to mark a work read without starting it first; restored after that was reported), and shelf. There's still no separate "Read Again" slot the way King books have - By Other Hands works have no reread history (see Non-Goals) - once read, the remaining actions are "Mark as Unread" (leftmost slot) and "Start Reading" again (start/finish slot).

**Mark-as-read collects a date range, rating, and note, mirroring `BookMarkReadModal`'s fields minus format and year.** `ByOtherHandsMarkReadModal.vue` uses the same `UInputDate range` + star-rating + note-textarea pattern as `BookMarkReadModal`/`BookReadDetailsFields`, writing directly to `user_related_works.note`/`.rating` (no format or year field - not asked for, and format fits awkwardly for a comic/reference book the way it does for a novel). Since this modal is reused for both "mark read directly" and "finish a currently-reading work" (there's no separate `FinishReadingModal` here), it takes an `initialStartedOn` prop so the date range prefills with the already-recorded start date when finishing, rather than asking the user to re-enter it - the same effect King gets from having two different modals for those two flows.

**Page: `app/pages/by-other-hands/index.vue` + `app/pages/by-other-hands/[slug].vue`, not a top-level `by-other-hands.vue` file.** See the detail-page decision above for why - a top-level file sharing a name with the `by-other-hands/` directory would silently become an implicit parent for everything under it (`nuxt-conventions` "A page file can't share a name with a sibling directory").

**Completion count is a plain client-side count over already-fetched data, not a new SQL view.** "X of Y read" for a single user against a list already loaded for the page doesn't need a `work_stats`-style aggregate view; it's the same kind of query-time arithmetic already used for the Dark Tower Related Works progress count in `dark-tower-page`, just scoped to this page's own data instead of a shared stats view.

## Risks / Trade-offs

[Someone later writes a new stats/leaderboard query directly against `user_books` and joins something unrelated in a way that accidentally pulls in By Other Hands data] → Not reachable by construction: `user_related_works` has no FK relationship to `king_works` or `user_books` at all, so there is nothing to accidentally join. The risk this design actually carries is the opposite direction - someone building a *future* cross-domain feature (e.g. "show By Other Hands items related to a King work") would need to add that link deliberately, which is the intended friction.

[Duplicating the owned/read-flag and omnibus-join pattern across two domains is more schema surface than a single polymorphic set of tables] → Accepted trade-off, consistent with `supabase-conventions`' existing preference for explicit typed tables over polymorphic ones (see the `adaptation_short_stories` vs. `adaptation_works` discussion in that skill) - a single table with a nullable `king_work_id`/`related_work_id` pair could represent neither-or-both, which is exactly the invalid state this schema style avoids elsewhere.
