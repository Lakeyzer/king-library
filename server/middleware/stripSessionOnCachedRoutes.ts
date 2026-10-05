// Cached public pages (shared/utils/cachedRoutes.ts) are stored by Vercel and
// served to every visitor until the next deploy, so their server render must
// never see who is asking. Dropping the cookie header here, before Nuxt
// renders, makes that true by construction: the Supabase server plugin, the
// onboarding middleware and every component see a signed-out request, and no
// session-refresh Set-Cookie can end up in a cached response. Everything
// personal on these pages loads in the browser instead (see the page-caching
// spec). Also applies in local dev, so `pnpm dev` renders cached routes the
// same anonymous way production caches them.
export default defineEventHandler((event) => {
  if (isCachedRoute(event.path)) {
    delete event.node.req.headers.cookie
  }
})
