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

export interface ViewingProgress {
  count: number
  total: number
}

export interface AdaptationRecommendation {
  id: string
  title: string
  slug: string
  tmdbPosterPath: string | null
  becauseTitle: string
}

export interface AdaptationHighlight {
  id: string
  title: string
  slug: string
  tmdbPosterPath: string | null
}

export interface AdaptationLeaderboardEntry extends AdaptationHighlight {
  count: number
}

export interface AdaptationHighlights {
  mostWatchedAdaptations: AdaptationLeaderboardEntry[]
  leastWatchedAdaptations: AdaptationLeaderboardEntry[]
  mostAnticipatedAdaptation: AdaptationLeaderboardEntry | null
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

  // Fetches the full adaptations list plus adaptation_stats in parallel and
  // joins them client-side - same pattern as useBooks().fetchWorkHighlights,
  // one column apart. One round trip pair powers every adaptation
  // leaderboard/spotlight, so callers (homepage, adaptations browsing
  // sidebar) share one fetch rather than each running their own.
  const fetchAdaptationHighlights = async (): Promise<AdaptationHighlights> => {
    interface AdaptationRow {
      id: string
      title: string
      slug: string
      tmdb_poster_path: string | null
    }

    interface AdaptationStatsRow {
      adaptation_id: string
      watched_count: number
      want_to_watch_count: number
    }

    const [{ data: adaptations, error: adaptationsError }, { data: stats, error: statsError }] = await Promise.all([
      supabase.from("adaptations").select("id, title, slug, tmdb_poster_path"),
      supabase.from("adaptation_stats").select("adaptation_id, watched_count, want_to_watch_count")
    ])

    if (adaptationsError) throw adaptationsError
    if (statsError) throw statsError

    const statsByAdaptationId = new Map((stats as AdaptationStatsRow[]).map((row) => [row.adaptation_id, row]))
    const adaptationsWithStats = (adaptations as AdaptationRow[]).map((adaptation) => ({
      ...adaptation,
      watchedCount: statsByAdaptationId.get(adaptation.id)?.watched_count ?? 0,
      wantToWatchCount: statsByAdaptationId.get(adaptation.id)?.want_to_watch_count ?? 0
    }))

    const toEntry = (adaptation: (typeof adaptationsWithStats)[number], count: number): AdaptationLeaderboardEntry => ({
      id: adaptation.id,
      title: adaptation.title,
      slug: adaptation.slug,
      tmdbPosterPath: adaptation.tmdb_poster_path,
      count
    })

    const sortedByWatched = [...adaptationsWithStats].sort(
      (a, b) => b.watchedCount - a.watchedCount || a.id.localeCompare(b.id)
    )

    // Same tie-break approach as least-read in useBooks(): a stable
    // secondary key so the pick doesn't flip between identical loads when
    // counts tie.
    const mostAnticipated = [...adaptationsWithStats].sort(
      (a, b) => b.wantToWatchCount - a.wantToWatchCount || a.id.localeCompare(b.id)
    )[0]

    return {
      mostWatchedAdaptations: sortedByWatched.slice(0, 5).map((adaptation) => toEntry(adaptation, adaptation.watchedCount)),
      leastWatchedAdaptations: [...sortedByWatched]
        .reverse()
        .slice(0, 5)
        .map((adaptation) => toEntry(adaptation, adaptation.watchedCount)),
      mostAnticipatedAdaptation: mostAnticipated ? toEntry(mostAnticipated, mostAnticipated.wantToWatchCount) : null
    }
  }

  // Accepts a userId (rather than assuming the signed-in user) so it powers
  // both the owner's own showcase and a public profile's, same as
  // fetchProfileBookStats in useBooks().
  const fetchViewingProgress = async (userId: string): Promise<ViewingProgress> => {
    const [{ data: adaptationRows, error: adaptationsError }, { data: userAdaptationRows, error: userAdaptationsError }] = await Promise.all([
      supabase.from("adaptations").select("id"),
      supabase.from("user_adaptations").select("adaptation_id, watched").eq("user_id", userId)
    ])

    if (adaptationsError) throw adaptationsError
    if (userAdaptationsError) throw userAdaptationsError

    const watchedIds = new Set(
      (userAdaptationRows as { adaptation_id: string, watched: boolean }[])
        .filter((row) => row.watched)
        .map((row) => row.adaptation_id)
    )

    return {
      count: watchedIds.size,
      total: (adaptationRows as { id: string }[]).length
    }
  }

  // Recommends one unwatched adaptation whose source (a King work or short
  // story) the given user has read - a personalized nudge, not a site-wide
  // stat, so it only ever reads the given userId's own rows (always allowed
  // under RLS regardless of profile privacy - a user can always read their
  // own rows). Picks randomly among qualifying candidates on each call
  // rather than a stable pick, since a "watch this next" suggestion
  // benefits from variety across visits more than site-wide leaderboards do.
  const fetchUnwatchedRecommendation = async (userId: string): Promise<AdaptationRecommendation | null> => {
    interface AdaptationRef {
      id: string
      title: string
      slug: string
      tmdb_poster_path: string | null
    }

    const [
      { data: readBooks, error: readBooksError },
      { data: readShortStories, error: readShortStoriesError },
      { data: watchedRows, error: watchedError }
    ] = await Promise.all([
      supabase
        .from("user_books")
        .select("king_work_id, king_works ( title )")
        .eq("user_id", userId)
        .eq("read", true),
      supabase
        .from("user_short_story_reads")
        .select(
          "short_story_id, king_short_stories ( title, king_short_story_collections ( king_works ( title, publish_date ) ) )"
        )
        .eq("user_id", userId),
      supabase
        .from("user_adaptations")
        .select("adaptation_id")
        .eq("user_id", userId)
        .eq("watched", true)
    ])

    if (readBooksError) throw readBooksError
    if (readShortStoriesError) throw readShortStoriesError
    if (watchedError) throw watchedError

    const readWorkRows = readBooks as unknown as { king_work_id: string, king_works: { title: string } | null }[]
    const readShortStoryRows = readShortStories as unknown as {
      short_story_id: string
      king_short_stories: {
        title: string
        king_short_story_collections: { king_works: { title: string, publish_date: string } | null }[]
      } | null
    }[]

    if (!readWorkRows.length && !readShortStoryRows.length) return null

    const watchedIds = new Set((watchedRows as { adaptation_id: string }[]).map((row) => row.adaptation_id))
    const workTitleById = new Map(readWorkRows.map((row) => [row.king_work_id, row.king_works?.title ?? ""]))

    // Prefer the story's earliest collection (per fetchCollectionsForShortStory's
    // same "take the first one" convention) as the recommendation's reason,
    // since a reader is more likely to recognize the collection they read
    // than an individual story's title - only fall back to the story's own
    // title when it isn't linked to any collection.
    const shortStoryBecauseTitleById = new Map<string, string>()
    for (const row of readShortStoryRows) {
      const story = row.king_short_stories
      if (!story) continue

      const collections = story.king_short_story_collections
        .map((link) => link.king_works)
        .filter((work): work is { title: string, publish_date: string } => work !== null)
        .sort((a, b) => a.publish_date.localeCompare(b.publish_date))

      shortStoryBecauseTitleById.set(row.short_story_id, collections[0]?.title ?? story.title)
    }

    const workIds = [...workTitleById.keys()]
    const shortStoryIds = [...shortStoryBecauseTitleById.keys()]

    const [viaWorksResult, viaShortStoriesResult] = await Promise.all([
      workIds.length
        ? supabase
            .from("adaptation_works")
            .select("king_work_id, adaptations ( id, title, slug, tmdb_poster_path )")
            .in("king_work_id", workIds)
        : { data: [], error: null },
      shortStoryIds.length
        ? supabase
            .from("adaptation_short_stories")
            .select("short_story_id, adaptations ( id, title, slug, tmdb_poster_path )")
            .in("short_story_id", shortStoryIds)
        : { data: [], error: null }
    ])

    if (viaWorksResult.error) throw viaWorksResult.error
    if (viaShortStoriesResult.error) throw viaShortStoriesResult.error

    const candidatesById = new Map<string, AdaptationRecommendation>()

    for (const row of viaWorksResult.data as unknown as {
      king_work_id: string
      adaptations: AdaptationRef | null
    }[]) {
      if (row.adaptations && !watchedIds.has(row.adaptations.id) && !candidatesById.has(row.adaptations.id)) {
        candidatesById.set(row.adaptations.id, {
          id: row.adaptations.id,
          title: row.adaptations.title,
          slug: row.adaptations.slug,
          tmdbPosterPath: row.adaptations.tmdb_poster_path,
          becauseTitle: workTitleById.get(row.king_work_id) ?? ""
        })
      }
    }

    for (const row of viaShortStoriesResult.data as unknown as {
      short_story_id: string
      adaptations: AdaptationRef | null
    }[]) {
      if (row.adaptations && !watchedIds.has(row.adaptations.id) && !candidatesById.has(row.adaptations.id)) {
        candidatesById.set(row.adaptations.id, {
          id: row.adaptations.id,
          title: row.adaptations.title,
          slug: row.adaptations.slug,
          tmdbPosterPath: row.adaptations.tmdb_poster_path,
          becauseTitle: shortStoryBecauseTitleById.get(row.short_story_id) ?? ""
        })
      }
    }

    const candidates = [...candidatesById.values()]
    if (!candidates.length) return null

    return candidates[Math.floor(Math.random() * candidates.length)] ?? null
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
    fetchViewingProgress,
    fetchAdaptationHighlights,
    fetchUnwatchedRecommendation,
    userAdaptationsByAdaptationId,
    fetchUserAdaptations,
    toggleWantToWatch,
    markWatched,
    unmarkWatched
  }
}
