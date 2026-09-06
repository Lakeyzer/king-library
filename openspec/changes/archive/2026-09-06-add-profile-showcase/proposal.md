## Why

The profile page is currently just account settings (linked identities, visibility toggle, delete account) — it does nothing to showcase the thing this app is actually about: how much of Stephen King's daunting bibliography a reader has conquered. The app has no centerpiece page. Turning `/profile` into a flashy reading-achievement dashboard, and moving account settings out to `/settings`, gives the app the "wow" page it's missing and makes a user's progress something worth sharing.

## What Changes

- Move the existing account-settings content (linked sign-in identities, public/private visibility toggle, delete account) from `/profile` to a new `/settings` page. **BREAKING**: `/profile` no longer shows account settings.
- Add a new profile showcase page that becomes the centerpiece of the app:
  - Reading-progress bars for three categories: overall King bibliography, Bachman books, and the Dark Tower series (each computed from the existing `dark_tower`/`bachman` flags on `king_works`)
  - An adaptation viewing-progress bar (watched vs. total adaptations)
  - A "Currently Reading" section displaying cover art for every work the profile owner currently has in progress, as a strip/carousel when there is more than one
  - A "Collection" progress indicator (owned vs. total bibliography) that will later link out to a not-yet-built bookshelf feature — for now the control is display-only and does not navigate anywhere
- The showcase is reachable two ways, reusing the existing public/private visibility toggle (no RLS changes needed — `user_books`/`user_adaptations` already allow reads when the owning profile is public):
  - `/profile` — the signed-in user's own dashboard (requires sign-in and a username, same gate the old profile page had)
  - `/profile/[username]` — a shareable, public view of any user's dashboard; shows a "this profile is private" state to everyone except the owner when the profile is private
- Header account menu gains a "Settings" entry alongside "Profile" so account settings stay reachable after the move

## Capabilities

### New Capabilities
- `profile-showcase`: the reading/viewing/collection progress dashboard shown at `/profile` (own) and `/profile/[username]` (public, respecting the visibility toggle)

### Modified Capabilities
- `user-profile`: its requirements describe the account-settings screen, which moves from `/profile` to `/settings` — requirement text updated to refer to the account settings page rather than the profile page (no behavioral change to sign-in gating, visibility toggle, deletion, or linked identities beyond the page's location)
- `app-shell`: the header's account menu gains a link to the new account settings page alongside the existing profile link

## Impact

- Affected pages: `app/pages/profile.vue` (becomes the settings page content, moved to `app/pages/settings.vue`), new `app/pages/profile/index.vue` and `app/pages/profile/[username].vue`
- Affected components: `app/components/core/AppHeader.vue` (account menu entries)
- New/updated composables: extend `useBooks`, `useKingWorks`, and `useAdaptations` (or add a dedicated composable) to compute per-category read counts and totals; extend `useProfile` to fetch a profile by username for the public route
- No database schema or RLS changes required — existing `is_public`-aware policies on `user_books` and `user_adaptations` already support another user reading a public profile's data
