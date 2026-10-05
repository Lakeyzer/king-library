## Why

The site is close to Vercel Hobby's 4h/month Fluid Active CPU limit (3h 17m used in the 30 days to Oct 3), almost all of it from server-rendering public pages on every request: `/` alone averages about 0.8s of CPU per render, and every public route showed a 0% cache hit rate. Those pages can't be cached today for two reasons:
- Their server render mixes in the signed-in viewer's own data (reading status, wishlist, recommendations, Dark Tower progress), so one cached copy would show one user's data to everyone.
- They also contain live community figures and date-based highlights, which a long-lived cached copy would freeze.

## What Changes

- Public pages are served from Vercel's CDN cache via ISR and kept until the next deployment. A page is rendered once per deployment, the first time it is requested, and never again until the next deploy. The pages are:
  - `/`
  - `/works`, `/adaptations`, `/short-works`, `/works-by-others`
  - every `/works/**`, `/adaptations/**`, `/short-works/**` and `/works-by-others/**` detail page
  - `/dark-tower`
- `/privacy-policy` is prerendered at build time.
- The server render of a cached page never depends on who is viewing it: no session is read and no per-viewer data is fetched. Everything personal loads in the browser after the page appears, straight from Supabase. That covers:
  - reading, watch and short-story status
  - edition and wishlist state
  - recommendations
  - Dark Tower progress and next-book suggestions
  - signed-in-only filters
- Every community figure and date-based highlight also loads in the browser, for every visitor, so it always shows current data:
  - the stats strips on work, adaptation and works-by-others detail pages
  - the homepage stats bar, catalog figures, leaderboards, spotlights, Book of the week and Book birthdays
  - the `/works` highlights, the `/adaptations` leaderboards and the `/dark-tower` journey stats
- Book of the week and Book birthdays are computed from the visitor's own local date.
- While personal data, community figures or highlights are still loading, the affected controls and sections show a neutral loading placeholder, never a wrong state (e.g. never "Want to read" on a book the viewer has read).
- The header's auth area shows a placeholder until the viewer's sign-in state is known, instead of flashing "Sign in" before switching to the account menu.
- Page titles, meta descriptions and share images stay in the server-rendered HTML of cached pages, so SEO and link previews are unchanged. The homepage's cached HTML no longer contains its leaderboards and spotlights; crawlers still reach those works through the sitemap and the browse pages.
- Signed-in-only pages (already client-rendered) and public `/profile/[username]/**` pages keep their current rendering.

## Capabilities

### New Capabilities
- `page-caching`: which pages are served from the shared cache, and the rule that cached HTML is identical for every visitor. It also covers how personal and community content loads, what's shown while it does, and the guarantees that still hold on cached pages (SEO metadata, onboarding redirect, query strings).

### Modified Capabilities
- `app-shell`: the header's authentication entry point gains a loading state shown until the viewer's sign-in state is known.

## Impact

- `nuxt.config.ts`: new `isr: true` / `prerender` route rules, driven by a shared list of cached routes.
- A new shared definition of cached routes, used by the route rules, the viewer composable and a server middleware so they can't drift apart.
- A new server middleware that removes the Supabase session cookie from requests to cached routes before Nuxt renders.
- A new viewer composable that hides the signed-in user from rendering until the app has hydrated on cached routes. Components that render per-viewer UI switch to it from `useSupabaseUser()`.
- Public pages (`index`, the `works`, `adaptations`, `short-works` and `works-by-others` index and `[slug]` pages, `dark-tower`): per-viewer and community/date `useAsyncData` calls become client-only (`server: false`), and their sections get skeleton placeholders.
- Book of the week and Book birthday selection move to run against the browser's local date.
- Status components (`BookReadingActions`, `AdaptationWatchActions`, short-story reading actions, edition toggle, wishlist controls) and the composables behind them gain a "loaded" flag for the placeholder state.
- `AppHeader`: auth placeholder.
- No database, RLS or API changes.
- Each page view makes a few more Supabase requests from the browser (community figures), well within Supabase's free tier.
- Vercel function invocations and Active CPU for public pages drop to roughly one render per page per deployment.
