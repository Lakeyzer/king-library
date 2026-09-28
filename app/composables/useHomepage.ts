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
  //
  // work_stats/adaptation_stats have no active column of their own (they're
  // per-row counts, not display data), so active works/adaptations are
  // fetched as id sets and used to filter the stats rows client-side before
  // summing - same "fetch two lists, join client-side" pattern as
  // useBooks().fetchWorkHighlights. This also gives the catalog totals
  // (active count) for free, without a second, separate count query. Both
  // the works list and work_stats are scoped to King works: related works
  // never count toward the homepage's book figures (see homepage spec).
  const fetchHomepageMeta = async (): Promise<HomepageMeta> => {
    const [
      { count: fanCount, error: profilesError },
      { count: shortStoriesCount, error: shortStoriesError },
      { data: activeWorkRows, error: worksError },
      { data: activeAdaptationRows, error: adaptationsError },
      { data: workStatsRows, error: workStatsError },
      { data: adaptationStatsRows, error: adaptationStatsError }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('king_short_stories').select('id', { count: 'exact', head: true }),
      supabase.from('works').select('id').eq('kind', 'king').eq('active', true),
      supabase.from('adaptations').select('id').eq('active', true),
      supabase.from('work_stats').select('work_id, read_count, owner_count').eq('kind', 'king'),
      supabase.from('adaptation_stats').select('adaptation_id, watched_count')
    ])

    if (profilesError) throw profilesError
    if (shortStoriesError) throw shortStoriesError
    if (worksError) throw worksError
    if (adaptationsError) throw adaptationsError
    if (workStatsError) throw workStatsError
    if (adaptationStatsError) throw adaptationStatsError

    const activeWorkIds = new Set((activeWorkRows as { id: string }[]).map(row => row.id))
    const activeAdaptationIds = new Set((activeAdaptationRows as { id: string }[]).map(row => row.id))

    const workStats = (workStatsRows as { work_id: string, read_count: number, owner_count: number }[]).filter(
      row => activeWorkIds.has(row.work_id)
    )
    const adaptationStats = (
      adaptationStatsRows as { adaptation_id: string, watched_count: number }[]
    ).filter(row => activeAdaptationIds.has(row.adaptation_id))

    return {
      stats: {
        fanCount: fanCount ?? 0,
        booksReadCount: workStats.reduce((sum, row) => sum + row.read_count, 0),
        booksOwnedCount: workStats.reduce((sum, row) => sum + row.owner_count, 0),
        adaptationsWatchedCount: adaptationStats.reduce((sum, row) => sum + row.watched_count, 0)
      },
      catalogTotals: {
        worksCount: activeWorkIds.size,
        shortStoriesCount: shortStoriesCount ?? 0,
        adaptationsCount: activeAdaptationIds.size
      }
    }
  }

  return { fetchHomepageMeta }
}
