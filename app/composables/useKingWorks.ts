export interface KingWork {
  id: string
  title: string
  type: string
  publish_date: string
  slug: string
  description: string | null
  co_author: string | null
  open_library_work_key: string | null
  cover_id: number | null
  dark_tower: boolean
  bachman: boolean
}

const KING_WORK_COLUMNS =
  "id, title, type, publish_date, slug, description, co_author, open_library_work_key, cover_id, dark_tower, bachman"

export function useKingWorks() {
  const supabase = useSupabaseClient()

  const fetchKingWorks = async () => {
    const { data, error } = await supabase
      .from("king_works")
      .select(KING_WORK_COLUMNS)
      .order("publish_date", { ascending: true })

    if (error) throw error

    return data as KingWork[]
  }

  const fetchKingWorkBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("king_works")
      .select(KING_WORK_COLUMNS)
      .eq("slug", slug)
      .maybeSingle()

    if (error) throw error

    return data as KingWork | null
  }

  return { fetchKingWorks, fetchKingWorkBySlug }
}
