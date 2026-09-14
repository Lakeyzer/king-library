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

  // Excludes inactive works - see king-works spec "Retrieve all King works
  // for display". Every browsing/search/homepage consumer goes through this
  // one fetch, so the exclusion is inherited rather than re-implemented per
  // caller.
  const fetchKingWorks = async () => {
    const { data, error } = await supabase
      .from("king_works")
      .select(KING_WORK_COLUMNS)
      .eq("active", true)
      .order("publish_date", { ascending: true })

    if (error) throw error

    return data as KingWork[]
  }

  // An inactive work's slug resolves the same as no match at all - see
  // king-works spec "Retrieve a single King work by slug" - so a detail page
  // built on this 404s automatically without its own inactive check.
  const fetchKingWorkBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("king_works")
      .select(KING_WORK_COLUMNS)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()

    if (error) throw error

    return data as KingWork | null
  }

  return { fetchKingWorks, fetchKingWorkBySlug }
}
