export interface Adaptation {
  id: string
  title: string
  type: string
  release_year: number
  slug: string
  tmdb_id: number | null
  tmdb_media_type: string | null
  tmdb_poster_path: string | null
  is_universe_only: boolean
  notes: string | null
}

export interface AdaptationSourceWork {
  id: string
  title: string
  slug: string
  type: string
  publish_date: string
  cover_id: number | null
}

export interface AdaptationSourceShortStory {
  id: string
  title: string
  type: string
  slug: string
  collections: { id: string; title: string; slug: string }[]
}

export interface AdaptationWithSources extends Adaptation {
  basedOnWorks: AdaptationSourceWork[]
  basedOnShortStories: AdaptationSourceShortStory[]
}

export interface WorkAdaptationSummary {
  id: string
  title: string
  slug: string
  type: string
  release_year: number
  tmdb_poster_path: string | null
}

export interface UserAdaptation {
  id: string
  user_id: string
  adaptation_id: string
  want_to_watch: boolean
  watched: boolean
  watched_at: string | null
}

export interface AdaptationStats {
  want_to_watch_count: number
  watched_count: number
}

const ADAPTATION_COLUMNS =
  "id, title, type, release_year, slug, tmdb_id, tmdb_media_type, tmdb_poster_path, is_universe_only, notes"

const USER_ADAPTATION_COLUMNS =
  "id, user_id, adaptation_id, want_to_watch, watched, watched_at"

export function useAdaptations() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const userAdaptationsByAdaptationId = useState<Record<string, UserAdaptation>>(
    "userAdaptationsByAdaptationId",
    () => ({})
  )

  const fetchAdaptations = async () => {
    const { data, error } = await supabase
      .from("adaptations")
      .select(ADAPTATION_COLUMNS)
      .order("release_year", { ascending: true })

    if (error) throw error

    return data as Adaptation[]
  }

  const fetchAdaptationBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("adaptations")
      .select(
        `${ADAPTATION_COLUMNS},
        adaptation_works ( king_works ( id, title, slug, type, publish_date, cover_id ) ),
        adaptation_short_stories ( king_short_stories (
          id, title, type, slug,
          king_short_story_collections ( king_works ( id, title, slug ) )
        ) )`
      )
      .eq("slug", slug)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    interface ShortStoryRow {
      king_short_stories: {
        id: string
        title: string
        type: string
        slug: string
        king_short_story_collections: { king_works: { id: string; title: string; slug: string } | null }[]
      } | null
    }

    const { adaptation_works, adaptation_short_stories, ...adaptation } = data as Adaptation & {
      adaptation_works: { king_works: AdaptationSourceWork | null }[]
      adaptation_short_stories: ShortStoryRow[]
    }

    return {
      ...adaptation,
      basedOnWorks: adaptation_works
        .map((row) => row.king_works)
        .filter((work): work is AdaptationSourceWork => work !== null),
      basedOnShortStories: adaptation_short_stories
        .map((row) => row.king_short_stories)
        .filter((story): story is NonNullable<ShortStoryRow["king_short_stories"]> => story !== null)
        .map((story) => ({
          id: story.id,
          title: story.title,
          type: story.type,
          slug: story.slug,
          collections: story.king_short_story_collections
            .map((row) => row.king_works)
            .filter((work): work is { id: string; title: string; slug: string } => work !== null)
        }))
    } satisfies AdaptationWithSources
  }

  // A work's adaptations come from two sources that must both be checked:
  // direct links in adaptation_works, and adaptations of a short story that
  // belongs to this work (when it's a collection) via king_short_story_collections.
  // See supabase-conventions: "Collection-level adaptation lookup" - the
  // collection link is deliberately never duplicated as an explicit
  // adaptation_works row, so it has to be derived here at query time instead.
  const fetchAdaptationsForWork = async (kingWorkId: string) => {
    const [direct, viaShortStory] = await Promise.all([
      supabase
        .from("adaptation_works")
        .select("adaptations ( id, title, slug, type, release_year, tmdb_poster_path )")
        .eq("king_work_id", kingWorkId),
      supabase
        .from("king_short_story_collections")
        .select(
          "king_short_stories ( adaptation_short_stories ( adaptations ( id, title, slug, type, release_year, tmdb_poster_path ) ) )"
        )
        .eq("king_work_id", kingWorkId)
    ])

    if (direct.error) throw direct.error
    if (viaShortStory.error) throw viaShortStory.error

    const directAdaptations = (direct.data as unknown as { adaptations: WorkAdaptationSummary | null }[])
      .map((row) => row.adaptations)

    const viaShortStoryAdaptations = (
      viaShortStory.data as unknown as {
        king_short_stories: { adaptation_short_stories: { adaptations: WorkAdaptationSummary | null }[] } | null
      }[]
    )
      .flatMap((row) => row.king_short_stories?.adaptation_short_stories ?? [])
      .map((row) => row.adaptations)

    const byId = new Map<string, WorkAdaptationSummary>()
    for (const adaptation of [...directAdaptations, ...viaShortStoryAdaptations]) {
      if (adaptation) byId.set(adaptation.id, adaptation)
    }

    return [...byId.values()]
  }

  const fetchAdaptationsForShortStory = async (shortStoryId: string) => {
    const { data, error } = await supabase
      .from("adaptation_short_stories")
      .select("adaptations ( id, title, slug, type, release_year, tmdb_poster_path )")
      .eq("short_story_id", shortStoryId)

    if (error) throw error

    return (data as unknown as { adaptations: WorkAdaptationSummary | null }[])
      .map((row) => row.adaptations)
      .filter((adaptation): adaptation is WorkAdaptationSummary => adaptation !== null)
  }

  const fetchAdaptationStats = async (adaptationId: string) => {
    const { data, error } = await supabase
      .from("adaptation_stats")
      .select("want_to_watch_count, watched_count")
      .eq("adaptation_id", adaptationId)
      .maybeSingle()

    if (error) throw error

    return data as AdaptationStats | null
  }

  const fetchUserAdaptations = async () => {
    if (!user.value) {
      userAdaptationsByAdaptationId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from("user_adaptations")
      .select(USER_ADAPTATION_COLUMNS)
      .eq("user_id", user.value.sub)

    if (error) throw error

    const rows = data as UserAdaptation[]
    userAdaptationsByAdaptationId.value = Object.fromEntries(rows.map((row) => [row.adaptation_id, row]))

    return rows
  }

  const toggleWantToWatch = async (adaptationId: string) => {
    if (!user.value) throw new Error("Not signed in")

    const { data: existing, error: fetchError } = await supabase
      .from("user_adaptations")
      .select("want_to_watch")
      .eq("user_id", user.value.sub)
      .eq("adaptation_id", adaptationId)
      .maybeSingle()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from("user_adaptations")
      .upsert(
        { user_id: user.value.sub, adaptation_id: adaptationId, want_to_watch: !existing?.want_to_watch },
        { onConflict: "user_id,adaptation_id" }
      )
      .select(USER_ADAPTATION_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserAdaptation
    userAdaptationsByAdaptationId.value = { ...userAdaptationsByAdaptationId.value, [adaptationId]: row }

    return row
  }

  const markWatched = async (adaptationId: string) => {
    if (!user.value) throw new Error("Not signed in")

    const { data, error } = await supabase
      .from("user_adaptations")
      .upsert(
        { user_id: user.value.sub, adaptation_id: adaptationId, watched: true, watched_at: new Date().toISOString() },
        { onConflict: "user_id,adaptation_id" }
      )
      .select(USER_ADAPTATION_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserAdaptation
    userAdaptationsByAdaptationId.value = { ...userAdaptationsByAdaptationId.value, [adaptationId]: row }

    return row
  }

  const unmarkWatched = async (adaptationId: string) => {
    if (!user.value) throw new Error("Not signed in")

    const { data, error } = await supabase
      .from("user_adaptations")
      .update({ watched: false })
      .eq("user_id", user.value.sub)
      .eq("adaptation_id", adaptationId)
      .select(USER_ADAPTATION_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserAdaptation
    userAdaptationsByAdaptationId.value = { ...userAdaptationsByAdaptationId.value, [adaptationId]: row }

    return row
  }

  return {
    fetchAdaptations,
    fetchAdaptationBySlug,
    fetchAdaptationsForWork,
    fetchAdaptationsForShortStory,
    fetchAdaptationStats,
    userAdaptationsByAdaptationId,
    fetchUserAdaptations,
    toggleWantToWatch,
    markWatched,
    unmarkWatched
  }
}
