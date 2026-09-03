export interface KingShortStory {
  id: string
  title: string
  type: string
  original_publish_year: number | null
  first_published_in: string | null
  dark_tower: boolean
  dark_tower_relation: string | null
}

export function useShortStories() {
  const supabase = useSupabaseClient()

  const fetchShortStories = async () => {
    const { data, error } = await supabase
      .from("king_short_stories")
      .select("id, title, type, original_publish_year, first_published_in, dark_tower, dark_tower_relation")
      .order("original_publish_year", { ascending: true })

    if (error) throw error

    return data as KingShortStory[]
  }

  return { fetchShortStories }
}
