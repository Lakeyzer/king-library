## Context

See proposal.md for the motivation. The current state that shapes this design:

- `user_books` has a `wishlisted boolean`, created in `20260904084036_create_user_books_table.sql`. A `before insert or update` trigger, `clear_wishlist_on_owned()`, forces it to `false` whenever `owned = true`. No UI reads or writes the flag. `useBooks.ts` selects it (`USER_BOOK_COLUMNS`, `UserBook`) and nothing else uses it. The `20260928095110_merge_related_works_into_works.sql` merge copied it across and set it to `false` for related works.
- `supabase-conventions` documents the flag as mutually exclusive with `owned`, says wishlisting is work-level only, and says "this app isn't trying to support 'wishlist a specific first edition'". This change reverses that stance, so the skill must be updated in the same change.
- Profile tabs are real routes (`app/pages/profile/*.vue` and `app/pages/profile/[username]/*.vue`), each wrapping a `Profile*Tab` component in `ProfileRouteChrome`. `ProfileTabs` builds the `UNavigationMenu` items. The Read List and Watch List tabs render through `BibliographyBrowsePage`.
- `workPath(kind, slug)` in `app/utils/workPath.ts` already resolves King and related detail URLs.
- The stack is `@nuxt/ui` ^4.11 on Nuxt 4. `UInputMenu` supports `multiple` and `create-item`, which covers "pick from suggestions or type a new one".

## Goals / Non-Goals

**Goals:**
- A wishlist entry is its own row, so a work can have many entries, each with its own note and tags.
- Tags are cheap to filter and to validate at the database level, even though custom tags are allowed.
- Privacy works exactly like every other `user_*` table: RLS on `profiles.is_public`, with no client-side privacy checks.
- The legacy `wishlisted` column is removed cleanly, with no data silently lost.

**Non-Goals:**
- Linking an entry to a specific Open Library edition. A note covers "want the 1st printing of the Viking edition" well enough for now.
- Wishlist counts in `work_stats`, leaderboards, recommendations, or profile compare.
- Server-side tag filtering or pagination on the Wishlist tab. Wishlists are small (tens of rows), so they are fetched whole and filtered client-side.
- A global tag registry or tag management UI.

## Decisions

### 1. A dedicated `user_wishlist_items` table instead of columns on `user_books`

```sql
create table user_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id uuid not null references works (id) on delete cascade,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_wishlist_items_note_length check (note is null or char_length(note) <= 1000),
  constraint user_wishlist_items_tags_count check (cardinality(tags) <= 10),
  constraint user_wishlist_items_tags_format check (valid_wishlist_tags(tags))
);
create index user_wishlist_items_user_created_idx on user_wishlist_items (user_id, created_at desc);
create index user_wishlist_items_work_idx on user_wishlist_items (work_id);
```

`user_books` is one row per `(user_id, work_id)`, and the user chose to allow multiple entries per work, so the entries cannot live there. A separate table also keeps wishlisting from creating otherwise-empty `user_books` rows. There is no unique constraint on `(user_id, work_id)`, on purpose.

- *Alternative considered*: a `jsonb` array of `{note, tags}` on `user_books`. Rejected: editing or deleting one entry means a read-modify-write of the whole array, there is no per-entry id, and RLS and constraints get awkward.

### 2. Tags as a normalized `text[]` with a check constraint, not a lookup table

Tags are stored as slugs (`first-printing`). The predefined list lives in one TypeScript constant, `WISHLIST_PRESET_TAGS`, in `app/utils/wishlistTags.ts`, together with `normalizeWishlistTag()` and `wishlistTagLabel()`. It does **not** live in the database. Because custom tags are allowed, the database cannot enforce an allow-list. It enforces the *shape* instead: an immutable SQL function, `valid_wishlist_tags(text[])`, checks that every element matches `^[a-z0-9]+(-[a-z0-9]+)*$`, has 1 to 30 characters, and has no duplicates. That guarantees normalized data even if a client skips normalization.

- Normalization (client): lowercase, replace each run of non-`[a-z0-9]` characters with a single `-`, trim leading and trailing `-`, drop the tag if it ends up empty, reject it if it is longer than 30 characters, and dedupe. "First Printing" becomes `first-printing`, so it matches the preset automatically.
- Labels: `wishlistTagLabel()` has hand-written labels for the presets (for example `mass-market-paperback` shows as "Mass-market paperback" and `ebook` as "eBook"). For any other tag it replaces hyphens with spaces and capitalizes the first letter.
- A GIN index on `tags` is not needed. Filtering happens client-side over one user's small list.
- *Alternative considered*: `wishlist_tags` and `user_wishlist_item_tags` join tables. Rejected: it adds a lot for no query we need. Per-user custom tags would need owner-scoped RLS on the tag table too, and adding a preset later would need a migration instead of a constant change.
- *Alternative considered*: a Postgres enum. Rejected because custom tags are allowed.

### 3. Suggestions = presets ∪ the user's own previously used tags

The tag input's items are `WISHLIST_PRESET_TAGS` plus the distinct tags across the signed-in user's own `user_wishlist_items`, which `useWishlist()` already has loaded. It never suggests other users' custom tags, so one user's tags cannot leak into another user's picker.

### 4. `useWishlist()` composable, keyed like `useBooks`

- `wishlistItemsByWorkId`: a `useState<Record<string, WishlistItem[]>>` holding the **signed-in user's** entries, filled by `fetchOwnWishlist()`. `BookReadingActions` reads it for the count badge, the same way it reads `userBooksByWorkId`. As with `fetchUserBooks`, the page must pre-fetch it (the nuxt-conventions "BookReadingActions... need their page to pre-fetch status" rule). Every page that already awaits `fetchUserBooks` for book actions also awaits `fetchOwnWishlist` (key `"user-wishlist"`), and `AppHeader`'s `watch(user, ...)` also calls it, so the store resets on sign-in and sign-out.
- `fetchWishlist(userId)`: a profile's entries joined to `works (id, kind, title, slug, cover_id, publish_date, active)`, filtered to `active`, ordered `created_at desc`. It returns `WishlistEntry[]` with `kind` for `workPath`.
- `addWishlistItem(workId, { note, tags })`, `updateWishlistItem(id, { note, tags })`, `removeWishlistItem(id)`: each normalizes tags, writes, then updates `wishlistItemsByWorkId` in place, so there is no full refetch.
- `WishlistTag` is a `string`. `WishlistPresetTag` is a literal union derived from the `as const` presets array, which follows the "literal union types" convention for the fixed part.

### 5. UI components

- **`BookWishlistModal`** (`app/components/book/WishlistModal.vue`): opened from `BookReadingActions`. It lists the viewer's existing entries for the work, each with its note, tag badges, and Edit and Remove actions. Below them is an add/edit form: a `UTextarea` for the note with a 1000-character counter, and a `UInputMenu multiple create-item` for tags, with items from decision 3 and `@create` running through `normalizeWishlistTag()`. Remove is a direct action followed by a toast. It is not a separate confirm modal, because an entry is cheap to recreate. The footer follows the nuxt-conventions modal-button rule.
- **`BookReadingActions`**: gains a wishlist button in both modes, with a heart or `i-lucide-gift` icon. It is filled or highlighted when `wishlistItemsByWorkId[workId]?.length > 0` and shows the count when there is more than one entry. When signed out, it opens the auth modal, like the other controls. Expanded mode currently caps at "3 buttons (plus Shelf)". The wishlist sits next to Shelf as a collection-type action and does not take one of the three reading-status slots. On small screens the stacked button row only fits four buttons, so Shelf and Wishlist merge into one "Collection" button (filled when the work is owned or wishlisted) that opens a menu with both actions. Larger screens keep two separate buttons.
- **`ProfileWishlistTab`** (`app/components/profile/WishlistTab.vue`): does **not** reuse `BibliographyBrowsePage`. That component is built around one row per work with year and type sort, while wishlist entries carry notes and tags and can repeat a work. It is a simple list of `ProfileWishlistItem` cards (cover thumbnail via the existing cover helper, title linking to `workPath(kind, slug)`, note, tag `UBadge`s) under a row of toggleable tag filter chips. The chips are the tags present in the fetched entries, and matching is AND. Owners get Edit and Remove on each card, which open the same `BookWishlistModal` in single-entry edit mode. The empty state and no-results-with-clear state use the same `UEmpty` pattern as the other tabs.
- **Routes**: `app/pages/profile/wishlist.vue` and `app/pages/profile/[username]/wishlist.vue` mirror `read-list.vue` exactly: `provideViewedProfile`, `ProfileRouteChrome`, `setPageSeo`. Sign-in gating for the own route is an explicit list: add `/profile/wishlist` to `isAuthGatedRoute()` in `app/utils/authGatedRoutes.ts`, which both `onboarding.global.ts` and AppHeader's sign-out handler read. The by-username route stays public, like Read List.
- **`ProfileTabs`**: insert `{ label: 'Wishlist', icon: <same icon as the button>, to: `${basePath}/wishlist` }` as the second item.

### 6. RLS: the standard four-policy owner/public set

The same shape as `user_books`: select `using (user_id = (select auth.uid()) or exists (select 1 from profiles where id = user_id and is_public))`, and insert/update/delete owner-only. `updated_at` is stamped by a small new `before update` trigger function, `stamp_user_wishlist_items_updated_at()`. No generic `updated_at` helper exists yet, so this follows the per-table pattern of `stamp_suggestion_admin_comment_updated_at()`.

### 7. Migration of the legacy flag

One migration, in this order:
1. Create the table, the function, the constraints, the indexes, RLS, and the trigger.
2. `insert into user_wishlist_items (user_id, work_id) select user_id, work_id from user_books where wishlisted` (no note, no tags).
3. `drop trigger user_books_clear_wishlist_on_owned on user_books; drop function clear_wishlist_on_owned(); alter table user_books drop column wishlisted;`

Before dropping, the implementer re-greps views and functions (`work_stats`, the omnibus cascades, and so on) for `wishlisted`. The current grep shows no dependent view, but dropping a referenced column would fail the migration, so this is a cheap check. Then regenerate `database.types.ts` and remove `wishlisted` from `useBooks.ts`.

## Risks / Trade-offs

- [Custom tags produce near-duplicates, e.g. `cemetary-dance` and `cemetery-dance`] → Suggesting the user's own previously used tags makes reuse the easy path. A rename or merge tool is out of scope.
- [Dropping `user_books.wishlisted` is irreversible on hosted] → Data is copied into `user_wishlist_items` first in the same transaction, and no UI ever wrote the flag, so hosted is expected to have zero or near-zero rows. To roll back, re-add the column and backfill `wishlisted = true` from distinct `(user_id, work_id)` in `user_wishlist_items`.
- [Another prefetch dependency for `BookReadingActions`: a page that forgets `fetchOwnWishlist` shows every work as not wishlisted] → Same failure mode as the existing `fetchUserBooks` rule. Tasks list every page that renders book actions, and the nuxt-conventions note is extended to name both fetches.
- [Public wishlists expose notes users might consider private (prices paid, sellers)] → Wishlists follow the same public/private toggle as everything else, as the user requested. The add form gets a short hint that entries are visible on a public profile.
- [Expanded book actions gets more crowded on mobile] → The wishlist button pairs with Shelf as an icon-plus-label collection action and collapses to icon-only at `sm`, matching `IconLabelButton` behaviour.
- [The in-flight `compare-profiles` change also edits `app/components/profile/Header.vue` and profile routes] → No overlapping files except possibly the `profile-showcase` main spec at archive time. The two deltas touch different requirements, so archive order does not matter.

## Migration Plan

1. Apply the migration locally with `supabase migration up`, never `db reset`, and regenerate types.
2. Test by hand locally with `pnpm dev`: add, edit and remove entries on a King work and a By Other Hands work, check that the Wishlist tab shows up on a public profile while signed out and that a private profile hides it.
3. Before merging to `main`, and with an explicit go-ahead, push the migration to hosted (`supabase db push`). No seed changes.
4. Merge. Vercel deploys the UI that depends on the new table.

## Open Questions

- Exact icon for the wishlist (heart vs gift vs bookmark-plus). Cosmetic, pick during implementation.
- Whether a signed-in viewer gets a "wishlist this too" shortcut on someone else's wishlist entries. Not specced; the item links to the work page, which already has the control.
