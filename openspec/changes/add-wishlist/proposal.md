## Why

Collectors track more than "own it / don't own it". A user suggested it this way: "I have a first edition but it's a second printing, so I'm keeping an eye out for a first printing", or "I have a first printing but it's in bad shape, so I want a better copy". Today they keep that shopping list in Notion, with labels and filters, so they can pull it up while browsing bookstores. The app already has a `user_books.wishlisted` flag, but no UI uses it, it can't hold a note or tags, and a trigger clears it the moment a work is owned. That makes the most common collector case ("I own it, but I'm hunting a better copy") impossible.

## What Changes

- Add a **wishlist** for both King works and Works by Others. A signed-in user can add a work to it from the book actions control, with an optional free-text note and any number of tags.
- A user can have **more than one wishlist entry per work** (for example "signed first printing" and a separate "cheap reading copy"). Each entry has its own note and tags, and each can be edited or removed on its own.
- Tags come from a **predefined list**, and users can also add **custom tags**. The predefined list is: `any`, `paperback`, `trade-paperback`, `mass-market-paperback`, `hardcover`, `first-edition`, `first-printing`, `signed`, `limited-edition`, `better-condition`, `dust-jacket`, `audiobook`, `ebook`, `foreign-edition`, `book-club-edition`. Custom tags are normalized to the same lowercase, hyphenated form.
- Wishlisting is **independent of ownership**. A work can be owned and on the wishlist at the same time, and adding an edition to the shelf no longer clears anything.
- Add a **Wishlist tab** to the profile as the second tab (Reader Checklist, Wishlist, Read List, Watch List), reachable at `/profile/wishlist` and `/profile/[username]/wishlist`. It lists every entry with its work, note and tags, and it can be filtered by tag. Anyone can see it when the profile is public, the same privacy gating as the other tabs. Only the owner can edit or remove entries from it.
- **BREAKING (schema only)**: replace the unused `user_books.wishlisted` column and its `clear_wishlist_on_owned` trigger with a dedicated `user_wishlist_items` table. Any existing `wishlisted = true` rows are migrated into untagged wishlist entries before the column is dropped. No shipped UI reads the column, so users see no break.
- Works by Others lose their "no wishlist" exception and get the same wishlist control as King works.

## Capabilities

### New Capabilities
- `wishlist`: Per-user wishlist entries against works (King and Works by Others), each with an optional note and a set of predefined or custom tags. Covers adding, editing and removing entries from the book actions control and from the profile Wishlist tab, filtering by tag, and public visibility governed by the profile's privacy setting.

### Modified Capabilities
- `profile-showcase`: The profile grows from three tabs to four, with Wishlist inserted as the second tab.
- `by-other-hands`: Remove the "By Other Hands works have no wishlist" requirement. By Other Hands works now offer the wishlist control.
- `reading-status`: The "Works by Others share every reading-status control except the wishlist" requirement no longer excludes the wishlist.

## Impact

- **Database**: new migration that creates `user_wishlist_items` (RLS: readable by the owner or when the profile is public, writes by the owner only), migrates the legacy `wishlisted` rows, and drops the `wishlisted` column plus the `clear_wishlist_on_owned()` function and trigger. `app/types/database.types.ts` is regenerated. The migration must be pushed to hosted Supabase before merging to `main`.
- **Composables**: new `useWishlist()` (fetch the signed-in user's entries by work, fetch a profile's wishlist, add/update/delete an entry). Remove `wishlisted` from `UserBook` / `USER_BOOK_COLUMNS` in `app/composables/useBooks.ts`.
- **Components/pages**: a wishlist control in `app/components/book/ReadingActions.vue` (compact and expanded), a new wishlist entry modal (note and tag input with predefined suggestions plus custom tags), a new `ProfileWishlistTab`, new pages `app/pages/profile/wishlist.vue` and `app/pages/profile/[username]/wishlist.vue`, and a Wishlist item in `app/components/profile/Tabs.vue`.
- **Docs**: update the `supabase-conventions` skill (the `user_books` table notes, the `clear_wishlist_on_owned` trigger section, the "no wishlist UI" note on related works, the "not trying to support wishlisting a specific edition" line, and the RLS table list) to describe `user_wishlist_items`.
- **Out of scope**: wishlists for adaptations or short stories, linking an entry to a specific Open Library edition, wishlist entries in profile compare, and notifications or statistics based on wishlists.
