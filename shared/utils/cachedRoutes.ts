// Public pages served from Vercel's CDN cache until the next deploy (see the
// page-caching spec and nuxt-conventions "Cached public pages"). One list,
// used by the `isr` route rules in nuxt.config.ts, the server middleware that
// strips the session cookie, and useViewer() - so they can never disagree
// about which pages are shared between visitors.
//
// A cached page's server render may only contain catalog content that changes
// through a reseed + deploy. Per-viewer data, community figures and anything
// date-dependent must load in the browser instead.

// Sections cached as both the browse page and every detail page under it.
const CACHED_SECTIONS = ['/works', '/adaptations', '/short-works', '/works-by-others']

// Single cached pages with nothing cached beneath them.
const CACHED_PAGES = ['/', '/dark-tower']

// Route-rule patterns. Base paths and their children are listed separately,
// so matching never depends on whether `/**` also covers its base.
export const CACHED_ROUTE_PATTERNS: string[] = [
  ...CACHED_PAGES,
  ...CACHED_SECTIONS.flatMap(section => [section, `${section}/**`])
]

// Nuxt also serves each cached page's data as `<page>/_payload.json` (cached
// by the same ISR rules), which is rendered from the same request and must be
// just as anonymous - so it counts as its page.
const PAYLOAD_SUFFIX = /\/_payload\.json$/

function pagePathname(path: string): string {
  return path.split(/[?#]/)[0]!.replace(PAYLOAD_SUFFIX, '').replace(/\/+$/, '') || '/'
}

function cachedSectionOf(pathname: string): string | undefined {
  return CACHED_SECTIONS.find(section => pathname === section || pathname.startsWith(`${section}/`))
}

export function isCachedRoute(path: string): boolean {
  const pathname = pagePathname(path)

  return CACHED_PAGES.includes(pathname) || cachedSectionOf(pathname) !== undefined
}

// Every cached page carries the tag `all-pages`, a tag for its own path and,
// under a section, a tag for that section:
//   `/adaptations/carrie-1976` -> all-pages, route:/adaptations/carrie-1976, section:/adaptations
// A page and its _payload.json get the same tags, so clearing a tag clears
// both together. After a hosted reseed, clear the tags of the pages whose
// catalog content changed (Vercel invalidate-by-tags) instead of redeploying.
export const ALL_CACHED_PAGES_TAG = 'all-pages'

export function cacheTagsFor(path: string): string[] {
  if (!isCachedRoute(path)) return []

  const pathname = pagePathname(path)
  const section = cachedSectionOf(pathname)

  return [
    ALL_CACHED_PAGES_TAG,
    `route:${pathname}`,
    ...(section ? [`section:${section}`] : [])
  ]
}
