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

export interface ShortStoryCollectionSummary {
  id: string
  title: string
  slug: string
  coverId: number | null
  publishDate: string
  storyCount: number
}

export interface CollectionsOverview {
  collections: ShortStoryCollectionSummary[]
  totalStories: number
  storiesInCollectionCount: number
  coveragePercent: number
  storyIdsInCollection: string[]
}

const KING_SHORT_STORY_COLUMNS =
  "id, title, type, original_publish_year, first_published_in, dark_tower, dark_tower_relation, slug"

export function useShortStories() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Row-existence table (see supabase-conventions "user_short_story_reads")
  // - no boolean flags on the row itself, so this just tracks which story
  // ids the user has a row for, same Record<id, ...> shape as
  // userBooksByWorkId/userAdaptationsByAdaptationId elsewhere.
  const readShortStoryIds = useState<Record<string, boolean>>("readShortStoryIds", () => ({}))

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

  // Powers the short works browsing sidebar: every collection, how many
  // stories each holds, and what share of all short stories/novellas appear
  // in any collection at all - fetched as two flat queries and joined
  // client-side rather than per-collection round trips, same "one round
  // trip, join in JS" pattern as useBooks().fetchWorkHighlights.
  const fetchCollectionsOverview = async (): Promise<CollectionsOverview> => {
    const [{ data: allStories, error: storiesError }, { data: links, error: linksError }] = await Promise.all([
      supabase.from("king_short_stories").select("id"),
      supabase
        .from("king_short_story_collections")
        .select("short_story_id, king_works ( id, title, slug, cover_id, publish_date )")
    ])

    if (storiesError) throw storiesError
    if (linksError) throw linksError

    const totalStories = (allStories as { id: string }[]).length

    const linkRows = links as unknown as {
      short_story_id: string
      king_works: ShortStoryCollection | null
    }[]

    const collectionById = new Map<string, ShortStoryCollectionSummary>()
    const storyIdsInCollection = new Set<string>()

    for (const row of linkRows) {
      if (!row.king_works) continue

      storyIdsInCollection.add(row.short_story_id)

      const existing = collectionById.get(row.king_works.id)
      if (existing) {
        existing.storyCount += 1
      } else {
        collectionById.set(row.king_works.id, {
          id: row.king_works.id,
          title: row.king_works.title,
          slug: row.king_works.slug,
          coverId: row.king_works.cover_id,
          publishDate: row.king_works.publish_date,
          storyCount: 1
        })
      }
    }

    const collections = [...collectionById.values()].sort((a, b) => a.publishDate.localeCompare(b.publishDate))

    return {
      collections,
      totalStories,
      storiesInCollectionCount: storyIdsInCollection.size,
      coveragePercent: totalStories > 0 ? Math.round((storyIdsInCollection.size / totalStories) * 100) : 100,
      storyIdsInCollection: [...storyIdsInCollection]
    }
  }

  const fetchUserShortStoryReads = async () => {
    if (!user.value) {
      readShortStoryIds.value = {}
      return
    }

    const { data, error } = await supabase
      .from("user_short_story_reads")
      .select("short_story_id")
      .eq("user_id", user.value.sub)

    if (error) throw error

    readShortStoryIds.value = Object.fromEntries(
      (data as { short_story_id: string }[]).map((row) => [row.short_story_id, true])
    )
  }

  // Row-existence toggle: insert to mark read, delete to unmark - there's no
  // boolean column to flip, unlike toggleWantToRead/toggleWantToWatch.
  const toggleRead = async (shortStoryId: string) => {
    if (!user.value) throw new Error("Not signed in")

    if (readShortStoryIds.value[shortStoryId]) {
      const { error } = await supabase
        .from("user_short_story_reads")
        .delete()
        .eq("user_id", user.value.sub)
        .eq("short_story_id", shortStoryId)

      if (error) throw error

      const { [shortStoryId]: _removed, ...rest } = readShortStoryIds.value
      readShortStoryIds.value = rest
    } else {
      // upsert, not insert: the collection-read cascade trigger may already
      // have created this row (e.g. the story's collection was marked read
      // elsewhere) without this page's state knowing about it yet.
      const { error } = await supabase
        .from("user_short_story_reads")
        .upsert(
          { user_id: user.value.sub, short_story_id: shortStoryId },
          { onConflict: "user_id,short_story_id" }
        )

      if (error) throw error

      readShortStoryIds.value = { ...readShortStoryIds.value, [shortStoryId]: true }
    }
  }

  return {
    fetchShortStories,
    fetchShortStoryBySlug,
    fetchShortStoriesForCollection,
    fetchCollectionsForShortStory,
    fetchCollectionsOverview,
    readShortStoryIds,
    fetchUserShortStoryReads,
    toggleRead
  }
}
