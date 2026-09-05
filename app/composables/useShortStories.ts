export interface KingShortStory {
  id: string
  title: string
  type: string
  original_publish_year: number | null
  first_published_in: string | null
  dark_tower: boolean
  dark_tower_relation: string | null
  slug: string
}

export interface CollectionShortStory {
  id: string
  title: string
  type: string
  slug: string
}

export interface ShortStoryCollection {
  id: string
  title: string
  slug: string
  cover_id: number | null
  publish_date: string
}

const KING_SHORT_STORY_COLUMNS =
  "id, title, type, original_publish_year, first_published_in, dark_tower, dark_tower_relation, slug"

export function useShortStories() {
  const supabase = useSupabaseClient()

  const fetchShortStories = async () => {
    const { data, error } = await supabase
      .from("king_short_stories")
      .select(KING_SHORT_STORY_COLUMNS)
      .order("original_publish_year", { ascending: true })

    if (error) throw error

    return data as KingShortStory[]
  }

  const fetchShortStoryBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("king_short_stories")
      .select(KING_SHORT_STORY_COLUMNS)
      .eq("slug", slug)
      .maybeSingle()

    if (error) throw error

    return data as KingShortStory | null
  }

  const fetchShortStoriesForCollection = async (kingWorkId: string) => {
    const { data, error } = await supabase
      .from("king_short_story_collections")
      .select("order_in_collection, king_short_stories ( id, title, type, slug )")
      .eq("king_work_id", kingWorkId)
      .order("order_in_collection", { ascending: true, nullsFirst: false })

    if (error) throw error

    return (data as unknown as { king_short_stories: CollectionShortStory | null }[])
      .map((row) => row.king_short_stories)
      .filter((story): story is CollectionShortStory => story !== null)
  }

  // A story can appear in more than one collection over the years (original
  // printing plus later anthologies) - sorted oldest first so callers that
  // just want "the" collection (e.g. for a cover) can take the first one.
  const fetchCollectionsForShortStory = async (shortStoryId: string) => {
    const { data, error } = await supabase
      .from("king_short_story_collections")
      .select("king_works ( id, title, slug, cover_id, publish_date )")
      .eq("short_story_id", shortStoryId)

    if (error) throw error

    return (data as unknown as { king_works: ShortStoryCollection | null }[])
      .map((row) => row.king_works)
      .filter((collection): collection is ShortStoryCollection => collection !== null)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  return {
    fetchShortStories,
    fetchShortStoryBySlug,
    fetchShortStoriesForCollection,
    fetchCollectionsForShortStory
  }
}
