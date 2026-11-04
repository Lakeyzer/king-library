// Tags each cached public page (shared/utils/cachedRoutes.ts) with
// `Vercel-Cache-Tag`, so a single page, a whole section or every cached page
// can be cleared on demand after a hosted reseed - see cacheTagsFor() for the
// tag scheme. Without tags the only way to refresh these pages is a redeploy.
export default defineEventHandler((event) => {
  const tags = cacheTagsFor(event.path)

  if (tags.length > 0) {
    setResponseHeader(event, 'Vercel-Cache-Tag', tags.join(','))
  }
})
