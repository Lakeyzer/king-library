import { serverSupabaseClient } from '#supabase/server'

// Public, curated bibliography tables - readable by everyone under RLS (see
// supabase-conventions), so the plain client is enough here, no service role
// needed. Slugs only: the sitemap just needs the loc, not full rows.
export default defineSitemapEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const [works, adaptations, shortStories] = await Promise.all([
    supabase.from('king_works').select('slug'),
    supabase.from('adaptations').select('slug'),
    supabase.from('king_short_stories').select('slug')
  ])

  if (works.error) throw works.error
  if (adaptations.error) throw adaptations.error
  if (shortStories.error) throw shortStories.error

  return [
    ...(works.data as { slug: string }[]).map(work => ({ loc: `/works/${work.slug}` })),
    ...(adaptations.data as { slug: string }[]).map(adaptation => ({ loc: `/adaptations/${adaptation.slug}` })),
    ...(shortStories.data as { slug: string }[]).map(story => ({ loc: `/short-works/${story.slug}` }))
  ]
})
