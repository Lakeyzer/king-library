## 1. Shared cached-route definition

- [x] 1.1 Add `shared/utils/cachedRoutes.ts` exporting the cached route list (`/`, `/works`, `/works/**`, `/adaptations`, `/adaptations/**`, `/short-works`, `/short-works/**`, `/works-by-others`, `/works-by-others/**`, `/dark-tower`) and `isCachedRoute(path)`. Verify `isCachedRoute` returns true for `/`, `/works`, `/works/the-stand` and `/dark-tower`, and false for `/profile`, `/profile/someone`, `/api/tmdb/movie/1`, `/settings` and `/_nuxt/x.js` (quick `node` check or a temporary log).

## 2. Server render never sees a session on cached routes

- [x] 2.1 Add a Nitro server middleware that deletes the `cookie` request header when `isCachedRoute(event.path)` holds for a page request. Verify with `pnpm dev`, signed in: the server-rendered HTML of `/works/<slug>` (view source) shows the signed-out header and no personal state, while `/profile/<username>` still renders with your session.
- [x] 2.2 Confirm the onboarding middleware no longer redirects during the server render of a cached route (no cookie, so no user), and still redirects in the browser. Verify with a signed-in local account that has no username: opening `/works` lands on `/onboarding`, and view source of `/works` contains the works page, not a redirect.

## 3. Hydration-safe viewer

- [x] 3.1 Add `useViewer()` (returns `{ user, isReady }`) and a client plugin that sets `isReady` on `app:mounted`. On the server, `isReady = !isCachedRoute(path)`; client-only pages start ready. Verify in dev: on `/works`, signed in, `isReady` starts false and flips true after mount; on `/profile/<username>` it is true during SSR.
- [x] 3.2 Switch every component or page that renders based on the signed-in user from `useSupabaseUser()` to `useViewer().user`:
  - `AppHeader`, `BookReadingActions`, `AdaptationWatchActions`, the short-story reading actions, `BookEditionToggle`, `ReportButton`, `ProfileHeader`
  - `LinkEmailPasswordModal`, if it renders on cached pages
  - the homepage hero's signed-in button
  - the `user.value` checks in the public pages' templates (signed-in-only filters)

  Composables keep `useSupabaseUser()` for queries. Verify that `grep -rn useSupabaseUser app/components app/pages` lists only uses that don't affect rendering, each with a comment saying why.

## 4. Per-viewer data loads in the browser

- [x] 4.1 Add a "loaded" `useState` flag next to each per-viewer store in `useBooks` (`userBooksByWorkId`), `useWishlist`, `useBookshelf` (editions), `useAdaptations` (`userAdaptationsByAdaptationId`) and `useShortStories` (short-story reads). Set it when a fetch for the current user completes. Clear it on user change or sign-out, including the `AppHeader` `watch(user)` refetch. Verify by logging the flags across sign-in and sign-out in dev.
- [x] 4.2 On `/`, `/works`, `/adaptations`, `/short-works`, `/works-by-others` and `/dark-tower`, make every per-viewer `useAsyncData` `server: false` and not awaited: the user stores, recommendations, and Dark Tower progress and next-book. Make sure each one runs again (or first runs) once the viewer is ready. Verify signed in on each page in dev: personal data appears after load, there are no hydration warnings in the console, and view source contains no personal data.
- [x] 4.3 Do the same for the per-viewer calls on `/works/[slug]`, `/adaptations/[slug]`, `/short-works/[slug]` and `/works-by-others/[slug]`. Verify as in 4.2.

## 5. Community figures and date-based highlights load in the browser

- [x] 5.1 Check that `isoWeekNumber()` and `todayIsoDate()` use the local date (local getters, not UTC), and fix them if not. Verify by temporarily setting the browser's timezone (devtools Sensors > Location) to one where the date differs from UTC, then checking the date the helpers return.
- [x] 5.2 Detail pages: make `work-<slug>-stats`, `adaptation-<slug>-stats` and `works-by-others-<slug>-stats` `server: false`, not awaited, with a `USkeleton` the size of the stats strip while loading. Keep the work, adaptation, related-works, short-story and TMDb data server-rendered and awaited. Verify in dev:
  - view source has the page's `<title>`, description and `og:image`, but no counts
  - counts appear after load, with a skeleton (not zeros) under "Slow 4G" throttling
  - marking a work read and reloading shows the updated count
- [x] 5.3 Homepage: make `homepage-meta`, `homepage-work-highlights` and `homepage-adaptation-highlights` `server: false`, not awaited. Replace the region gated on `meta && workHighlights && adaptationHighlights` with a same-height skeleton region while loading. Verify:
  - view source has the hero, title and description, but no stats, leaderboards, spotlights, Book of the week or birthdays
  - throttled, the skeleton holds the layout, then the real sections appear
  - signed out and signed in both work
- [x] 5.4 `/works` and `/adaptations`: make `works-page-highlights` and `adaptations-page-highlights` `server: false` with skeletons; the works and adaptations lists stay server-rendered. `/dark-tower`: same for `dark-tower-journey-stats`. Verify view source and throttled loading as in 5.3.

## 6. Placeholders instead of wrong states

- [x] 6.1 Status components (`BookReadingActions`, `AdaptationWatchActions`, short-story reading actions, `BookEditionToggle`, wishlist control) render a same-size `USkeleton` while `!viewer.isReady`, or while `viewer.user && !loaded`. Verify with "Slow 4G" throttling, signed in: the controls show skeletons, then your real status, never "Want to read" on a read book first.
- [x] 6.2 Recommendation, Dark Tower progress and next-book sections render nothing until their data arrives, and nothing if it's empty. Verify throttled, signed in and signed out, on `/`, `/works`, `/adaptations` and `/dark-tower`.
- [x] 6.3 `AppHeader` shows a `USkeleton` the size of the account button until `viewer.isReady`, then the account menu or the sign-in control. Verify throttled:
  - signed in, you never see "Sign in"
  - the header doesn't shift
  - on `/profile/<username>` there's no skeleton
- [x] 6.4 Simulate failed fetches by blocking the `user_books` and `work_stats` requests in devtools. Verify the controls and stats stay on placeholders, with no guessed state or zero counts.

## 7. Route rules

- [x] 7.1 Generate `isr: true` route rules in `nuxt.config.ts` from `shared/utils/cachedRoutes.ts`, with `allowQuery: []`. Check Nitro's vercel preset source for how it handles `allowQuery` and its own `url` parameter, and adjust if needed. Add `'/privacy-policy': { prerender: true }`. Verify with `NITRO_PRESET=vercel pnpm build`:
  - `.vercel/output/functions/*.prerender-config.json` shows no expiration (cached until deploy) and the expected allowQuery for each cached route
  - `privacy-policy/index.html` exists in `.vercel/output/static`
  - `/profile/**` has no prerender config

  Delete `.vercel` afterwards.
- [x] 7.2 Confirm `/?signin=1&next=/profile` still opens the sign-in modal and returns to `/profile` after sign-in (it reads the query in `onMounted`). Verify in dev.

## 8. Docs and checks

- [x] 8.1 Add a "Cached public pages" section to the `nuxt-conventions` skill:
  - the cached-route list lives in `shared/utils/cachedRoutes.ts`
  - cached pages are kept until the next deploy, so their server-rendered data may only be catalog content that changes through reseed plus deploy
  - per-viewer data, community figures and anything date-dependent must be `server: false`
  - render with `useViewer()`, not `useSupabaseUser()`
  - use loaded flags and skeletons instead of empty states while loading

  Mention it in the skill's description. Verify the section exists and contains no em dash.
- [x] 8.2 Run `pnpm exec eslint` on the changed files and `pnpm typecheck`. Verify no new errors beyond the known pre-existing ones (the `profile/[username]/compare.vue` type error and unrelated lint errors).

## 9. Post-release verification (production)

- [ ] 9.1 After deploy, run `curl -sI https://www.king-library.com/works/the-stand` twice. Verify the second response shows `x-vercel-cache: HIT` and neither has `set-cookie`. Repeat for `/`, `/adaptations` and a query-string variant (`/works?utm_source=x`, which should HIT the same entry).
- [ ] 9.2 Signed in on production, verify that:
  - status controls and counts fill in after placeholders on a detail page
  - view source contains no personal data or counts
  - a new account without a username is sent to `/onboarding`
  - `/profile/<username>` link previews still show the profile's title
- [ ] 9.3 Request an unknown `/works/does-not-exist` twice and inspect `x-vercel-cache` to see how Vercel treats non-200 ISR responses. Record the result in design.md's risks. If a 5xx response would be cached until the next deploy, add error-response handling before relying on it.
- [ ] 9.4 After 2-3 days, compare Vercel Observability (Active CPU per day, per-route cache hit rate) with the pre-change baseline (about 6-14 min/day, 0% hits on public routes).
