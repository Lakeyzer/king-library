export interface SeriesMember {
  workId: string
  position: number
}

export interface Series {
  id: string
  name: string
  members: SeriesMember[]
}

export interface SeriesMembership {
  seriesId: string
  seriesName: string
  position: number
}

export interface SeriesProgress {
  id: string
  name: string
  count: number
  total: number
}

interface SeriesRow {
  id: string
  name: string
  series_works: { work_id: string, position: number }[]
}

export function useSeries() {
  const supabase = useSupabaseClient()

  // Map of work_id -> that work's series membership, mirroring
  // useBooks()'s userBooksByWorkId pattern - see design.md "One useSeries
  // composable, consumed by useBookshelf".
  const seriesByWorkId = useState<Record<string, SeriesMembership>>('seriesByWorkId', () => ({}))

  const fetchAllSeries = async (): Promise<Series[]> => {
    const { data, error } = await supabase
      .from('series')
      .select('id, name, series_works ( work_id, position )')
      .order('position', { referencedTable: 'series_works', ascending: true })

    if (error) throw error

    const rows = data as unknown as SeriesRow[]

    const series: Series[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      members: row.series_works.map(member => ({
        workId: member.work_id,
        position: member.position
      }))
    })).sort(compareSeriesOrder)

    const membership: Record<string, SeriesMembership> = {}
    for (const one of series) {
      for (const member of one.members) {
        membership[member.workId] = { seriesId: one.id, seriesName: one.name, position: member.position }
      }
    }
    seriesByWorkId.value = membership

    return series
  }

  // One read-progress figure per series, in fetchAllSeries order - see the
  // king-series spec's "Per-series reading progress for a user". Members of
  // both kinds count (a series can include a By Other Hands book, e.g.
  // Gwendy's Magic Feather), so unlike fetchProfileBookStats there's no
  // `kind` filter. Active, non-omnibus members only, same as the King
  // progress figures. Accepts a userId so it powers both the owner's own
  // showcase and a public profile's.
  const fetchSeriesProgress = async (userId: string): Promise<SeriesProgress[]> => {
    const series = await fetchAllSeries()
    const memberIds = [...new Set(series.flatMap(one => one.members.map(member => member.workId)))]

    if (!memberIds.length) return series.map(one => ({ id: one.id, name: one.name, count: 0, total: 0 }))

    const [{ data: works, error: worksError }, { data: alternates, error: alternatesError }, { data: userBooks, error: booksError }] = await Promise.all([
      // Both kinds intended - series membership spans King and related works.
      supabase.from('works').select('id, type, active').in('id', memberIds),
      // An alternate text points at its series member via counts_with_id
      // (the original Gunslinger -> the Revised Edition, which is the
      // member) - reading it satisfies the member's slot, same rule as
      // useBooks().fetchNextDarkTowerBook.
      supabase.from('works').select('id, counts_with_id').in('counts_with_id', memberIds),
      supabase.from('user_books').select('work_id').eq('user_id', userId).eq('read', true)
    ])

    if (worksError) throw worksError
    if (alternatesError) throw alternatesError
    if (booksError) throw booksError

    const countedIds = new Set(
      (works as { id: string, type: string | null, active: boolean }[])
        .filter(work => work.active && work.type !== 'omnibus')
        .map(work => work.id)
    )
    const readWorkIds = new Set((userBooks as { work_id: string }[]).map(row => row.work_id))

    const alternateIdsByMemberId = new Map<string, string[]>()
    for (const alternate of alternates as { id: string, counts_with_id: string | null }[]) {
      const memberId = alternate.counts_with_id!
      alternateIdsByMemberId.set(memberId, [...(alternateIdsByMemberId.get(memberId) ?? []), alternate.id])
    }

    const isMemberRead = (workId: string) =>
      readWorkIds.has(workId) || (alternateIdsByMemberId.get(workId) ?? []).some(id => readWorkIds.has(id))

    return series.map((one) => {
      const counted = one.members.filter(member => countedIds.has(member.workId))
      return {
        id: one.id,
        name: one.name,
        count: counted.filter(member => isMemberRead(member.workId)).length,
        total: counted.length
      }
    })
  }

  return {
    seriesByWorkId,
    fetchAllSeries,
    fetchSeriesProgress
  }
}
