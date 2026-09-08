## Why

The current homepage is a static hero plus three identical "browse this section" CTAs — it says nothing about the app actually being used, and gives a returning signed-in visitor no reason to come back other than habit. A flashy, stats-driven homepage (mirroring the profile showcase's use of live numbers and leaderboards) gives both new and returning visitors something dynamic to look at, surfaces content they might not browse to on their own (book of the week, book birthday, least-read book), and gives clearer, auth-aware next actions.

## What Changes

- Replace the homepage hero with an auth-aware version: same title/description on the left, but the CTA on the right prompts a signed-out visitor to start tracking reading progress (sign-in/sign-up) and prompts a signed-in visitor to add to their collection.
- **BREAKING**: Remove the homepage's three equal Works / Short Stories / Adaptations intro-CTA sections. Short Stories loses its homepage presence entirely (it remains reachable via the header's primary navigation, per `app-shell`); Works and Adaptations are replaced by the sections below plus a closing CTA each.
- Add a two-column stats/suggestions area below the hero:
  - **Stats bar**: total number of profiles (a usage stat, counted regardless of `is_public`), total books marked read, total adaptations marked watched.
  - **Book of the week**: a single featured `king_work`, deterministically selected by `current ISO week number % total king_works count` against each work's `shuffle_position`.
  - **Book birthday**: any `king_works` whose `original_publish_date` month/day matches today (zero, one, or many).
  - **Most read books**: top 5 `king_works` by count of `user_books.read = true`.
  - **Currently reading**: top 5 `king_works` by count of `user_books.currently_reading = true` (a leaderboard, not a single total).
  - **Least read book**: the `king_works` row (excluding works with a future `original_publish_date`) with the lowest `read` count; shows the signed-in user's own read state if they've read it, otherwise a start-reading prompt; signed-out visitors see the same book with a generic start-reading prompt.
  - **Most watched adaptations**: top 5 `adaptations` by count of `user_adaptations.watched = true`.
  - **Least watched adaptations**: bottom 5 `adaptations` by the same count, ascending.
  - Closing CTAs linking to the Works browsing page and the Adaptations browsing page.
- The fan count reads the `profiles` table directly, which is already public-read regardless of `is_public` (that flag only ever gates `user_books`/`user_adaptations` visibility) — no schema change needed there. The "books read" / "adaptations watched" totals and every leaderboard reuse the existing `work_stats` / `adaptation_stats` views as-is: those are already granted to `anon`, and per `supabase-conventions` they are deliberately RLS-scoped anonymous aggregates (a private profile's rows don't count toward them) — same behavior every other feature that reads those views already has, not a special case introduced here.
- Add a `shuffle_position` integer column to `king_works`, assigned once via a random shuffle across all existing works at migration time, and auto-assigned to the next available position for any work added afterward — no manually maintained rotation list.

## Capabilities

### New Capabilities
(none — the redesigned homepage is a rewrite of the existing `homepage` capability, and the rotation field is an extension of the existing `king-works` capability)

### Modified Capabilities
- `homepage`: full rewrite of hero, section structure, and homepage content — replaces the static intro/CTA sections with the auth-aware hero and the stats/leaderboard/spotlight sections described above.
- `king-works`: adds the `shuffle_position` field and its once-only shuffle + auto-assignment-on-insert behavior.

## Impact

- `app/pages/index.vue` — full rewrite.
- New composable(s) for homepage data (site-wide stats, book of the week, book birthday, leaderboards), following `supabase-conventions` (no direct `supabase.from(...)` in `.vue` files).
- New Supabase migration: `shuffle_position` column + backfill shuffle + insert-time auto-assignment on `king_works`.
- New composable (e.g. `useHomepage()`) reading `profiles` (count), `work_stats`/`adaptation_stats` (leaderboards and totals), and `king_works` (book of the week, book birthday, least-read), per `supabase-conventions`.
- Likely reuses visual patterns from `app/components/profile/*` (progress bars, showcase-style cards) for leaderboard/stat presentation, per Nuxt UI conventions.
