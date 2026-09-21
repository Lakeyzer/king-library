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
  dark_tower_relation: string | null
}

const KING_WORK_COLUMNS =
  "id, title, type, publish_date, slug, description, co_author, open_library_work_key, cover_id, dark_tower, bachman, dark_tower_relation"

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

  // The novels collected by an 'omnibus' work (e.g. "The Bachman Books" ->
  // Rage, The Long Walk, Roadwork, The Running Man), via
  // king_work_omnibus_works. Mirrors useShortStories().fetchShortStoriesForCollection
  // one join shape over - see supabase-conventions "king_work_omnibus_works".
  const fetchComponentWorksForOmnibus = async (omnibusKingWorkId: string) => {
    const { data, error } = await supabase
      .from("king_work_omnibus_works")
      .select("king_works!king_work_omnibus_works_component_king_work_id_fkey ( id, title, slug, cover_id, publish_date )")
      .eq("omnibus_king_work_id", omnibusKingWorkId)

    if (error) throw error

    type ComponentWork = { id: string, title: string, slug: string, cover_id: number | null, publish_date: string }

    return (data as unknown as { king_works: ComponentWork | null }[])
      .map((row) => row.king_works)
      .filter((work): work is ComponentWork => work !== null)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  return { fetchKingWorks, fetchKingWorkBySlug, fetchComponentWorksForOmnibus }
}
