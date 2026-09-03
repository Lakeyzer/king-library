export interface KingWork {
  id: string
  title: string
  type: string
  original_publish_year: number
  open_library_work_key: string | null
  cover_id: number | null
  dark_tower: boolean
  bachman: boolean
}

export function useKingWorks() {
  const supabase = useSupabaseClient()

  const fetchKingWorks = async () => {
    const { data, error } = await supabase
      .from("king_works")
      .select("id, title, type, original_publish_year, open_library_work_key, cover_id, dark_tower, bachman")
      .order("original_publish_year", { ascending: true })

    if (error) throw error

    return data as KingWork[]
  }

  return { fetchKingWorks }
}
