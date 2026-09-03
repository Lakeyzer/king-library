export interface Adaptation {
  id: string
  title: string
  type: string
  release_year: number
  tmdb_id: number | null
  tmdb_media_type: string | null
  tmdb_poster_path: string | null
  is_universe_only: boolean
  notes: string | null
}

export function useAdaptations() {
  const supabase = useSupabaseClient()

  const fetchAdaptations = async () => {
    const { data, error } = await supabase
      .from("adaptations")
      .select("id, title, type, release_year, tmdb_id, tmdb_media_type, tmdb_poster_path, is_universe_only, notes")
      .order("release_year", { ascending: true })

    if (error) throw error

    return data as Adaptation[]
  }

  return { fetchAdaptations }
}
