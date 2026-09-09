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

interface SeriesRow {
  id: string
  name: string
  series_works: { king_work_id: string, position: number }[]
}

export function useSeries() {
  const supabase = useSupabaseClient()

  // Map of king_work_id -> that work's series membership, mirroring
  // useBooks()'s userBooksByWorkId pattern - see design.md "One useSeries
  // composable, consumed by useBookshelf".
  const seriesByWorkId = useState<Record<string, SeriesMembership>>('seriesByWorkId', () => ({}))

  const fetchAllSeries = async (): Promise<Series[]> => {
    const { data, error } = await supabase
      .from('series')
      .select('id, name, series_works ( king_work_id, position )')
      .order('position', { referencedTable: 'series_works', ascending: true })

    if (error) throw error

    const rows = data as unknown as SeriesRow[]

    const series: Series[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      members: row.series_works.map((member) => ({
        workId: member.king_work_id,
        position: member.position
      }))
    }))

    const membership: Record<string, SeriesMembership> = {}
    for (const one of series) {
      for (const member of one.members) {
        membership[member.workId] = { seriesId: one.id, seriesName: one.name, position: member.position }
      }
    }
    seriesByWorkId.value = membership

    return series
  }

  return {
    seriesByWorkId,
    fetchAllSeries
  }
}
