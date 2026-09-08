export interface HomepageStats {
  fanCount: number
  booksReadCount: number
  booksOwnedCount: number
  adaptationsWatchedCount: number
}

export interface CatalogTotals {
  worksCount: number
  shortStoriesCount: number
  adaptationsCount: number
}

export interface HomepageMeta {
  stats: HomepageStats
  catalogTotals: CatalogTotals
}

export function useHomepage() {
  const supabase = useSupabaseClient()

  // The book/adaptation leaderboards and spotlights live in
  // useBooks().fetchWorkHighlights() and useAdaptations().fetchAdaptationHighlights()
  // now, since the works/adaptations browsing pages reuse them too - this
  // composable only covers what's genuinely homepage-only: the site-wide
  // fan/read/watched counts and the catalog totals row.
  const fetchHomepageMeta = async (): Promise<HomepageMeta> => {
    const [
      { count: fanCount, error: profilesError },
      { count: shortStoriesCount, error: shortStoriesError },
      { count: worksCount, error: worksError },
      { count: adaptationsCount, error: adaptationsError },
      { data: workStatsRows, error: workStatsError },
      { data: adaptationStatsRows, error: adaptationStatsError }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('king_short_stories').select('id', { count: 'exact', head: true }),
      supabase.from('king_works').select('id', { count: 'exact', head: true }),
      supabase.from('adaptations').select('id', { count: 'exact', head: true }),
      supabase.from('work_stats').select('read_count, owner_count'),
      supabase.from('adaptation_stats').select('watched_count')
    ])

    if (profilesError) throw profilesError
    if (shortStoriesError) throw shortStoriesError
    if (worksError) throw worksError
    if (adaptationsError) throw adaptationsError
    if (workStatsError) throw workStatsError
    if (adaptationStatsError) throw adaptationStatsError

    const workStats = workStatsRows as { read_count: number, owner_count: number }[]

    return {
      stats: {
        fanCount: fanCount ?? 0,
        booksReadCount: workStats.reduce((sum, row) => sum + row.read_count, 0),
        booksOwnedCount: workStats.reduce((sum, row) => sum + row.owner_count, 0),
        adaptationsWatchedCount: (adaptationStatsRows as { watched_count: number }[]).reduce(
          (sum, row) => sum + row.watched_count,
          0
        )
      },
      catalogTotals: {
        worksCount: worksCount ?? 0,
        shortStoriesCount: shortStoriesCount ?? 0,
        adaptationsCount: adaptationsCount ?? 0
      }
    }
  }

  return { fetchHomepageMeta }
}
