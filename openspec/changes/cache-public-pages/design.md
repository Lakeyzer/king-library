## Context

See proposal.md (Why) for the CPU problem. The current state that shapes the approach:

- **Every public page calls `useAsyncData` for three kinds of data:**
  - shared catalog data (works, adaptations, related works, TMDb details)
  - community figures (`fetchWorkStats`, `fetchAdaptationStats`, `fetchRelatedWorkStats`, `fetchHomepageMeta`, `fetchWorkHighlights`, `fetchAdaptationHighlights`, `fetchDarkTowerJourneyStats`)
  - per-viewer data (`user-books`, `user-wishlist`, `user-editions`, `user-adaptations`, `user-short-story-reads`, recommendations, Dark Tower progress)

  The per-viewer calls short-circuit to empty when `useSupabaseUser()` is null.
- **Two highlights depend on the current date.** `fetchWorkHighlights` picks Book of the week (`isoWeekNumber()`) and Book birthdays (`todayIsoDate()`). It runs on the server today, so it uses the server's date.
- **The Supabase plugins read the session on both sides.** `@nuxtjs/supabase`'s server plugin reads it from cookies on every SSR request. Its client plugin (`enforce: 'pre'`, awaited) restores it from the browser cookie and sets `useSupabaseUser()` **before hydration**.
- **`useAsyncData` doesn't refetch on hydration** when its key is already in the payload. So a server-rendered result that gets cached is never refreshed in the browser.
- **Several components branch on `useSupabaseUser()` directly in their templates:** `AppHeader` (`v-if="user"` on the account menu), `BookReadingActions`, `AdaptationWatchActions`, the short-story reading actions, `BookEditionToggle`, `ReportButton`, the homepage hero's signed-in button, and the signed-in-only filter options on the browse pages.
- **The global `onboarding` route middleware runs twice on a full page load:** on the server for the initial request, and again in the browser on hydration.
- **How `isr` works on Vercel:** Nitro's `vercel` preset turns `isr` route rules into Vercel prerender functions. `isr: true` caches a page until the next deployment.
- **Shared code:** Nuxt 4 shares code between `app/` and `server/` through the root `shared/` directory.

## Goals / Non-Goals

**Goals:**
- Make the server render of a cached route provably independent of the viewer and of time. This has to be enforced in one place, not left to every page remembering to follow it.
- Cached HTML contains only data that changes when we deploy (catalog content and SEO metadata). Anything that changes between deploys is loaded in the browser.
- No hydration mismatches on cached routes, for signed-in or signed-out visitors.
- Keep what visitors see the same as today once loading finishes; only add loading placeholders.

**Non-Goals:**
- Caching `/profile/[username]/**`, or turning SSR back on for the signed-in-only pages (they stay `ssr: false` from the CPU fixes in 0.18.0).
- Speeding up the server render itself. A render now happens about once per page per deploy, so there's little left to gain.
- Live (push-based) updating of community figures while a page is open. They reflect the data at the moment the page loaded, as today.
- On-demand revalidation (a bypass token triggered by reseeds). Reseeds already happen right before a deploy, and the deploy discards the cache.

## Decisions

### 1. One shared definition of cached routes
`shared/utils/cachedRoutes.ts` exports the list of cached route patterns and `isCachedRoute(path)`:
- `/`
- `/works`, `/works/**`
- `/adaptations`, `/adaptations/**`
- `/short-works`, `/short-works/**`
- `/works-by-others`, `/works-by-others/**`
- `/dark-tower`

`nuxt.config.ts` builds `isr: true` route rules from that list. The cookie middleware (decision 2) and the viewer gate (decision 3) use `isCachedRoute`.

Nuxt also generates an ISR route for each cached page's `_payload.json` (e.g. `/_payload.json`, `/works/<slug>/_payload.json`). That file is rendered from the same request as the page, so `isCachedRoute` treats `<page>/_payload.json` as its page. Otherwise the payload would keep the session cookie, and one visitor's session state could end up in a cached payload. Base paths and their children are listed separately, so matching doesn't depend on whether `/**` also matches its base.

`/privacy-policy` gets `prerender: true` directly in `nuxt.config.ts`. It isn't in this list because it has no per-viewer content and nothing else needs to know about it.

*Alternative:* hand-write the rules in `nuxt.config.ts` and repeat the list in the middleware. Rejected because the lists can drift, and drift here means caching a viewer's data.

### 2. Cache until deploy; everything that changes between deploys loads in the browser
Cached HTML only holds data that changes through a reseed plus deploy: works, adaptations, short stories, related works, their relationships, TMDb details, and SEO metadata. That makes `isr: true` (no expiry) correct by construction; there's no freshness window to tune.

The two kinds of data that do change between deploys both move to the browser:
- per-viewer data (decision 5)
- community figures and date-based highlights (decision 6)

*Alternative (the earlier version of this plan):* hourly or ten-minute windows with figures kept in the HTML. Rejected for three reasons:
- Figures would lag by up to the window, including right after a visitor's own action.
- Long-tail detail pages visited less than once per window would still render on nearly every visit.
- The homepage would still render every ten minutes for date-dependent content.

*Cost of this approach:* community figures appear a moment after the page itself, and the homepage's cached HTML has no leaderboards or spotlights (see Risks).

TMDb details on adaptation pages (overview, rating, runtime) stay in the cached HTML. They freeze until the next deploy, which is frequent, and they barely change.

### 3. Remove the session cookie for cached routes on the server
A Nitro server middleware deletes the `cookie` request header when `isCachedRoute(event.path)` is true for a page request. It never does this for `/api/**`, `/_nuxt/**` or other non-page paths.

Nothing during that render can then see a session: the Supabase server plugin, the onboarding middleware, or a component calling `useSupabaseUser()`. This also means no `Set-Cookie` session refresh can end up in a cached response.

This makes the server render independent of the viewer **by construction**, and it doesn't rely on whether Vercel forwards the triggering request's cookies to an ISR render. It also applies in local dev, where nothing is cached. So `pnpm dev` reproduces exactly the anonymous server render that production caches, and hydration problems show up locally.

*Alternatives:*
- Rely on Vercel not forwarding cookies to prerender functions. Rejected because it's undocumented for our setup, and getting it wrong leaks data.
- Guard every per-viewer fetch and the middleware with `import.meta.server && isCachedRoute(...)`. Rejected because it's easy to forget on the next page, and it doesn't cover the Supabase plugin's own cookie refresh.

### 4. A hydration-safe viewer: `useViewer()`
A composable `useViewer()` returns `{ user, isReady }`:
- `isReady` is a `useState` flag. On the server it is `!isCachedRoute(initialPath)`: non-cached SSR routes render with the real user, so they're ready immediately. On a client-only (`ssr: false`) page it starts `true`. On a cached route it starts `false` and is set to `true` by a client plugin's `app:mounted` hook, which runs after hydration.
- `user` is `isReady ? useSupabaseUser() : null`.

Every component and page that renders something based on the signed-in user switches from `useSupabaseUser()` to `useViewer()`. On a cached route, the first client render then matches the anonymous server HTML exactly, and the personal UI appears on the next tick. On other routes nothing changes.

Composables keep using `useSupabaseUser()` for queries. They run in the browser, where the real user is already known.

*Alternatives:*
- Wrap each personal block in `<ClientOnly>`. Rejected because it's very scattered (every status control in every list tile), and on non-cached SSR routes (profile pages) it would add a placeholder flash where there's none today.
- Accept Vue's hydration-mismatch repair. Rejected because the repair is unreliable for `v-if` branches, and it logs warnings that would hide real problems.

### 5. Per-viewer fetches become client-only
On every cached page, the per-viewer `useAsyncData` calls get `server: false` and are no longer awaited:
- `user-books`, `user-wishlist`, `user-editions`, `user-adaptations`, `user-short-story-reads`
- the recommendation keys
- the Dark Tower progress and next-book keys

They run after hydration on a full page load, and immediately on a client-side navigation, as now.

The per-viewer stores also need to refetch when `useViewer().isReady` turns true on a cached route. On the server-skipped run, the plugin has already set the user, so the fetch sees the real user. This needs checking per key: with `server: false`, the first browser run happens after hydration.

The rule from nuxt-conventions about using the exact same key strings across pages is unchanged.

### 6. Community figures and date-based highlights become client-only
On every cached page, the community and date `useAsyncData` calls get `server: false` and are no longer awaited, for every visitor:
- detail stats: `work-<slug>-stats`, `adaptation-<slug>-stats`, `works-by-others-<slug>-stats`
- `homepage-meta`, `homepage-work-highlights`, `homepage-adaptation-highlights`
- `works-page-highlights`, `adaptations-page-highlights`
- `dark-tower-journey-stats`

Each section shows a `USkeleton` placeholder sized like its content until its data arrives.

The homepage's catalog row, stats bar, leaderboards and spotlights are one region gated on `meta && workHighlights && adaptationHighlights`. It becomes a skeleton region while those load, so the page height doesn't jump.

Because `fetchWorkHighlights` now runs in the browser, `isoWeekNumber()` and `todayIsoDate()` run there too, so they use the visitor's local date. Both helpers must use local-date getters, not UTC ones; the implementation checks this.

*Alternative:* move only the detail-page stats and keep the homepage and browse highlights in the HTML with a short window. Rejected because it keeps per-window renders on the busiest page, and the date-dependent highlights would still need a window.

### 7. "Loaded" flags drive the loading placeholders for per-viewer controls
`useBooks`, `useWishlist`, `useBookshelf`, `useAdaptations` and `useShortStories` each expose a `useState` "loaded" flag next to their per-viewer store (e.g. `userBooksLoaded`). It is set when a fetch for the current user completes, and cleared when the user changes or signs out.

The status components show a fixed-size `USkeleton`:
- while `!viewer.isReady`
- while `viewer.user && !loaded`

When there's no viewer, they show the signed-out control as now, once ready.

If a fetch fails, the flag stays unset and the control keeps showing the placeholder rather than a guessed state.

Community sections (decision 6) don't need flags: each one is driven by its own page-level `useAsyncData`, so its `status` / `data` is enough.

*Alternative:* derive the per-viewer "loaded" state from each page's `useAsyncData` `status`. Rejected because the status components read shared stores and don't know which page-level call filled them.

### 8. Header auth placeholder
`AppHeader` renders a `USkeleton` the size of the account button while `!useViewer().isReady`. When ready, it shows the account menu or the sign-in control. On non-cached SSR routes `isReady` is already true, so the header looks exactly as it does today.

### 9. Query strings
Cached HTML must not depend on the query string; the existing `/?signin=1&next=...` handling already runs in `onMounted`. The `isr` rules set `allowQuery: []`, so Vercel serves one cache entry per path. Without it, every distinct query string (`?utm_*`, `?fbclid`) would create its own cache entry and its own render.

The implementation must check how Nitro's vercel preset handles `allowQuery`. The preset routes ISR requests through its own `url` query parameter, so the rule may need to keep that parameter.

## Risks / Trade-offs

- **[Risk] A personal or community fetch is missed and stays server-rendered, so its result is cached until the next deploy and the browser never refetches it.**
  - For personal data, decision 3 guarantees the cached result is the empty signed-out one, never another user's.
  - For community data, the figures would simply freeze until the next deploy.
  - → Mitigation: tasks include a per-page check of view source (no personal data, no counts or leaderboards) and of the network tab, in dev, signed in and signed out.
- **[Risk] Hydration mismatch from a component still reading `useSupabaseUser()` in its template.** → Mitigation: a task greps for `useSupabaseUser` in `app/components` and `app/pages`. Dev mode logs mismatches, and decision 3 makes local dev render cached routes anonymously, so they reproduce locally.
- **[Trade-off] Community figures and highlights appear a moment after the page itself, for every visitor, on a full page load.** → Accepted; skeletons keep the layout stable. Client-side navigations behave as today.
- **[Trade-off] Signed-in viewers see a brief placeholder for personal controls on a full page load.** → Accepted. This is the cost of a shared HTML copy.
- **[Trade-off] The homepage's cached HTML no longer contains its leaderboard and spotlight links.** → Accepted. Crawlers still reach every work through the sitemap and the browse pages, and the homepage keeps its title, description and hero.
- **[Trade-off] Book of the week and Book birthdays use the visitor's local date.** Around midnight, and at the ISO-week boundary, visitors in different timezones can briefly see a different selection. → Accepted; arguably more correct for "today" than the server's UTC date.
- **[Trade-off] Each page view makes a few more Supabase requests from the browser** (the figures that used to be fetched once on the server per render). → Within Supabase's free tier at this traffic, and it costs no Vercel CPU.
- **[Risk] Vercel caches a render that failed (e.g. Supabase down while rendering) or a 404 for an unknown slug, until the next deploy.** → Verify after deploy how Vercel treats non-200 ISR responses. A cached 404 for a bot-probed slug is harmless (a new work only goes live with a deploy, which discards the cache). If a 5xx would be cached until the next deploy, that's serious: exclude errors from caching (e.g. render error responses with no-store headers) before relying on `isr: true`.
- **[Found in testing] A redirect during hydration mangles the layout.** On a cached page, the onboarding redirect can only happen in the browser, during hydration. Vue then hydrates `/onboarding` against the cached page's markup, and the centered container went full width. → The onboarding middleware defers that redirect until `app:suspense:resolve` and then navigates with `replace`. The visitor briefly sees the cached page before landing on onboarding. Any future middleware that redirects signed-in visitors away from a cached page needs the same treatment.
- **[Risk] The cookie middleware also strips cookies from a request that needs them.** → It only matches page paths in the cached list. API routes, `_nuxt` assets, auth-gated pages and profile pages never match.

## Migration Plan

1. Ship everything in one release: the route list, cookie middleware, viewer gate, client-only personal and community fetches, loaded flags, placeholders and route rules. The cookie middleware, viewer gate and client-only fetches are what make `isr: true` safe, so the route rules must not ship without them.
2. After deploy, check on production:
   - `curl -I` twice on a detail page: the second response is `x-vercel-cache: HIT`, and neither response has a `Set-Cookie`.
   - View source has no personal data and no community figures.
   - Signed in: placeholders fill in with real status and live counts.
   - The onboarding redirect still works.
   - Check how Vercel treats non-200 ISR responses.
3. Rollback: remove the `isr` / `prerender` rules (one line in `nuxt.config.ts`) and redeploy. Everything else keeps working without caching; pages just render per request again, with figures loading in the browser.
