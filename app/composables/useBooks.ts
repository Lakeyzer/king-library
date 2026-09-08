export interface CategoryProgress {
  count: number
  total: number
}

export interface ProfileBookStats {
  overall: CategoryProgress
  bachman: CategoryProgress
  darkTower: CategoryProgress
  collection: CategoryProgress
}

export interface CurrentlyReadingWork {
  id: string
  title: string
  slug: string
  coverId: number | null
  startedOn: string | null
}

export interface ReadingTimelineEntry {
  id: string
  title: string
  slug: string
  coverId: number | null
  readOn: string | null
  readYear: number | null
}

export interface WorkHighlight {
  id: string
  title: string
  slug: string
  coverId: number | null
  publishDate: string
}

export interface WorkLeaderboardEntry extends WorkHighlight {
  count: number
}

export interface WorkHighlights {
  bookOfTheWeek: WorkHighlight | null
  bookBirthdays: WorkHighlight[]
  mostReadBooks: WorkLeaderboardEntry[]
  currentlyReadingLeaderboard: WorkLeaderboardEntry[]
  leastReadBook: WorkLeaderboardEntry | null
  mostWantedBook: WorkLeaderboardEntry | null
}

export interface BookRecommendation {
  id: string
  title: string
  slug: string
  coverId: number | null
  publishDate: string
  becauseTitle: string
}

// No "because" reason to attach (unlike BookRecommendation, driven by a
// watched adaptation) - the reason is always the same static fact ("it's on
// your shelf"), so it isn't a field on the type.
export interface OwnedUnreadRecommendation {
  id: string
  title: string
  slug: string
  coverId: number | null
  publishDate: string
}

export interface WorkStats {
  want_to_read_count: number
  currently_reading_count: number
  read_count: number
  owner_count: number
  owners_who_read_count: number
  read_through_rate: number | null
}

export interface UserBook {
  id: string
  user_id: string
  king_work_id: string
  owned: boolean
  wishlisted: boolean
  want_to_read: boolean
  currently_reading: boolean
  started_on: string | null
  read: boolean
  finished_on: string | null
  read_year: number | null
}

const USER_BOOK_COLUMNS = 'id, user_id, king_work_id, owned, wishlisted, want_to_read, currently_reading, started_on, read, finished_on, read_year'

interface KingWorkRow {
  id: string
  title: string
  slug: string
  cover_id: number | null
  publish_date: string
  shuffle_position: number
}

interface WorkStatsRow {
  king_work_id: string
  read_count: number
  currently_reading_count: number
  want_to_read_count: number
}

interface WorkWithStats extends KingWorkRow {
  readCount: number
  currentlyReadingCount: number
  wantToReadCount: number
}

function toWorkHighlight(work: WorkWithStats): WorkHighlight {
  return {
    id: work.id,
    title: work.title,
    slug: work.slug,
    coverId: work.cover_id,
    publishDate: work.publish_date
  }
}

function toWorkLeaderboardEntry(work: WorkWithStats, count: number): WorkLeaderboardEntry {
  return { ...toWorkHighlight(work), count }
}

function todayIsoDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ISO 8601 week number (weeks 1-53, Monday-start, week 1 contains the year's
// first Thursday) - the standard algorithm, operating on UTC dates so the
// calendar day used for the calculation doesn't shift with time-of-day.
function isoWeekNumber(): number {
  const now = new Date()
  const current = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNumber = (current.getUTCDay() + 6) % 7
  current.setUTCDate(current.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(current.getUTCFullYear(), 0, 4))
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3)
  return 1 + Math.round((current.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

export function useBooks() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const userBooksByWorkId = useState<Record<string, UserBook>>('userBooksByWorkId', () => ({}))

  const fetchUserBooks = async () => {
    if (!user.value) {
      userBooksByWorkId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from('user_books')
      .select(USER_BOOK_COLUMNS)
      .eq('user_id', user.value.sub)

    if (error) throw error

    const rows = data as UserBook[]
    userBooksByWorkId.value = Object.fromEntries(rows.map((row) => [row.king_work_id, row]))

    return rows
  }

  const fetchWorkStats = async (workId: string) => {
    const { data, error } = await supabase
      .from('work_stats')
      .select('want_to_read_count, currently_reading_count, read_count, owner_count, owners_who_read_count, read_through_rate')
      .eq('king_work_id', workId)
      .maybeSingle()

    if (error) throw error

    return data as WorkStats | null
  }

  // Computed client-side from the full king_works list plus one user's user_books
  // rows, rather than a dedicated SQL view - see design.md "Progress numbers
  // computed client-side" for why that's the right call at this data volume.
  // Accepts a userId (rather than assuming the signed-in user) so the same
  // function powers both the owner's own showcase and a public profile's.
  const fetchProfileBookStats = async (userId: string): Promise<ProfileBookStats> => {
    const [{ data: works, error: worksError }, { data: userBooks, error: booksError }] = await Promise.all([
      supabase.from('king_works').select('id, dark_tower, bachman'),
      supabase.from('user_books').select('king_work_id, read, owned').eq('user_id', userId)
    ])

    if (worksError) throw worksError
    if (booksError) throw booksError

    const allWorks = works as { id: string, dark_tower: boolean, bachman: boolean }[]
    const rows = userBooks as { king_work_id: string, read: boolean, owned: boolean }[]

    const readWorkIds = new Set(rows.filter((row) => row.read).map((row) => row.king_work_id))
    const ownedWorkIds = new Set(rows.filter((row) => row.owned).map((row) => row.king_work_id))

    const progressFor = (predicate: (work: { dark_tower: boolean, bachman: boolean }) => boolean): CategoryProgress => {
      const inCategory = allWorks.filter(predicate)
      return {
        count: inCategory.filter((work) => readWorkIds.has(work.id)).length,
        total: inCategory.length
      }
    }

    return {
      overall: progressFor(() => true),
      bachman: progressFor((work) => work.bachman),
      darkTower: progressFor((work) => work.dark_tower),
      collection: {
        count: allWorks.filter((work) => ownedWorkIds.has(work.id)).length,
        total: allWorks.length
      }
    }
  }

  // Fetches the full king_works list plus work_stats in parallel and joins
  // them client-side - same "computed client-side at this data volume" call
  // as fetchProfileBookStats above. One round trip pair powers book of the
  // week, book birthday, and every book-related leaderboard/spotlight, so
  // callers (homepage, works browsing sidebar) share one fetch rather than
  // each running their own.
  const fetchWorkHighlights = async (): Promise<WorkHighlights> => {
    const [{ data: works, error: worksError }, { data: stats, error: statsError }] = await Promise.all([
      supabase.from('king_works').select('id, title, slug, cover_id, publish_date, shuffle_position'),
      supabase.from('work_stats').select('king_work_id, read_count, currently_reading_count, want_to_read_count')
    ])

    if (worksError) throw worksError
    if (statsError) throw statsError

    const statsByWorkId = new Map((stats as WorkStatsRow[]).map((row) => [row.king_work_id, row]))
    const worksWithStats: WorkWithStats[] = (works as KingWorkRow[]).map((work) => ({
      ...work,
      readCount: statsByWorkId.get(work.id)?.read_count ?? 0,
      currentlyReadingCount: statsByWorkId.get(work.id)?.currently_reading_count ?? 0,
      wantToReadCount: statsByWorkId.get(work.id)?.want_to_read_count ?? 0
    }))

    const today = todayIsoDate()
    const todayMonthDay = today.slice(5)

    const bookOfTheWeekPosition = worksWithStats.length > 0 ? isoWeekNumber() % worksWithStats.length : 0
    const bookOfTheWeekWork = worksWithStats.find((work) => work.shuffle_position === bookOfTheWeekPosition) ?? null

    const bookBirthdayWorks = worksWithStats.filter((work) => work.publish_date.slice(5) === todayMonthDay)

    const mostReadBooks = [...worksWithStats]
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 5)
      .map((work) => toWorkLeaderboardEntry(work, work.readCount))

    const currentlyReadingLeaderboard = [...worksWithStats]
      .sort((a, b) => b.currentlyReadingCount - a.currentlyReadingCount)
      .slice(0, 5)
      .map((work) => toWorkLeaderboardEntry(work, work.currentlyReadingCount))

    // Released works only, lowest read count first, tie-broken by
    // shuffle_position so the same work is picked on every load - see
    // design.md "Least read book: tie-break on shuffle_position".
    const releasedWorks = worksWithStats.filter((work) => work.publish_date <= today)
    const leastReadWork = [...releasedWorks].sort(
      (a, b) => a.readCount - b.readCount || a.shuffle_position - b.shuffle_position
    )[0]

    // Same tie-break approach as least-read: a stable secondary key so the
    // pick doesn't flip between identical loads when counts tie.
    const mostWantedWork = [...worksWithStats].sort(
      (a, b) => b.wantToReadCount - a.wantToReadCount || a.shuffle_position - b.shuffle_position
    )[0]

    return {
      bookOfTheWeek: bookOfTheWeekWork ? toWorkHighlight(bookOfTheWeekWork) : null,
      bookBirthdays: bookBirthdayWorks.map(toWorkHighlight),
      mostReadBooks,
      currentlyReadingLeaderboard,
      leastReadBook: leastReadWork ? toWorkLeaderboardEntry(leastReadWork, leastReadWork.readCount) : null,
      mostWantedBook: mostWantedWork ? toWorkLeaderboardEntry(mostWantedWork, mostWantedWork.wantToReadCount) : null
    }
  }

  // Mirror of useAdaptations().fetchUnwatchedRecommendation: recommends one
  // unread King work whose adaptation the given user has watched - a
  // personalized nudge, so it only ever reads the given userId's own rows
  // (always allowed under RLS regardless of profile privacy). Picks
  // randomly among qualifying candidates on each call, same reasoning as
  // the adaptation-side recommendation.
  //
  // A watched adaptation sourced from a short story has no king_work of its
  // own to recommend directly - the recommendable unit is the collection
  // that contains the story (via king_short_story_collections), mirroring
  // how the adaptation-side recommendation prefers a short story's
  // collection as its "because" reason.
  const fetchUnreadRecommendation = async (userId: string): Promise<BookRecommendation | null> => {
    interface WorkRef {
      id: string
      title: string
      slug: string
      cover_id: number | null
      publish_date: string
    }

    const [
      { data: watchedRows, error: watchedError },
      { data: readBooks, error: readBooksError }
    ] = await Promise.all([
      supabase
        .from('user_adaptations')
        .select('adaptation_id, adaptations ( title )')
        .eq('user_id', userId)
        .eq('watched', true),
      supabase
        .from('user_books')
        .select('king_work_id')
        .eq('user_id', userId)
        .eq('read', true)
    ])

    if (watchedError) throw watchedError
    if (readBooksError) throw readBooksError

    const watchedAdaptationRows = watchedRows as unknown as {
      adaptation_id: string
      adaptations: { title: string } | null
    }[]

    if (!watchedAdaptationRows.length) return null

    const readWorkIds = new Set((readBooks as { king_work_id: string }[]).map((row) => row.king_work_id))
    const adaptationTitleById = new Map(
      watchedAdaptationRows.map((row) => [row.adaptation_id, row.adaptations?.title ?? ''])
    )
    const adaptationIds = [...adaptationTitleById.keys()]

    const [viaWorksResult, viaShortStoriesResult] = await Promise.all([
      supabase
        .from('adaptation_works')
        .select('adaptation_id, king_works ( id, title, slug, cover_id, publish_date )')
        .in('adaptation_id', adaptationIds),
      supabase
        .from('adaptation_short_stories')
        .select(
          'adaptation_id, king_short_stories ( king_short_story_collections ( king_works ( id, title, slug, cover_id, publish_date ) ) )'
        )
        .in('adaptation_id', adaptationIds)
    ])

    if (viaWorksResult.error) throw viaWorksResult.error
    if (viaShortStoriesResult.error) throw viaShortStoriesResult.error

    const candidatesById = new Map<string, BookRecommendation>()

    const addCandidate = (work: WorkRef | null, adaptationId: string) => {
      if (!work || readWorkIds.has(work.id) || candidatesById.has(work.id)) return

      candidatesById.set(work.id, {
        id: work.id,
        title: work.title,
        slug: work.slug,
        coverId: work.cover_id,
        publishDate: work.publish_date,
        becauseTitle: adaptationTitleById.get(adaptationId) ?? ''
      })
    }

    for (const row of viaWorksResult.data as unknown as { adaptation_id: string, king_works: WorkRef | null }[]) {
      addCandidate(row.king_works, row.adaptation_id)
    }

    for (const row of viaShortStoriesResult.data as unknown as {
      adaptation_id: string
      king_short_stories: { king_short_story_collections: { king_works: WorkRef | null }[] } | null
    }[]) {
      for (const link of row.king_short_stories?.king_short_story_collections ?? []) {
        addCandidate(link.king_works, row.adaptation_id)
      }
    }

    const candidates = [...candidatesById.values()]
    if (!candidates.length) return null

    return candidates[Math.floor(Math.random() * candidates.length)] ?? null
  }

  // A second, distinct personalized nudge from fetchUnreadRecommendation
  // above: that one suggests a book based on a watched adaptation; this one
  // suggests a book the user already owns but hasn't read yet - the
  // simplest possible "you already have this" prompt, no adaptation
  // involved. Same randomized-pick-among-candidates and userId-param
  // reasoning as every other personalized recommendation here.
  const fetchOwnedUnreadRecommendation = async (userId: string): Promise<OwnedUnreadRecommendation | null> => {
    interface WorkRef {
      id: string
      title: string
      slug: string
      cover_id: number | null
      publish_date: string
    }

    const { data, error } = await supabase
      .from('user_books')
      .select('king_works ( id, title, slug, cover_id, publish_date )')
      .eq('user_id', userId)
      .eq('owned', true)
      .eq('read', false)

    if (error) throw error

    const candidates = (data as unknown as { king_works: WorkRef | null }[])
      .map((row) => row.king_works)
      .filter((work): work is WorkRef => work !== null)

    if (!candidates.length) return null

    const work = candidates[Math.floor(Math.random() * candidates.length)]!

    return {
      id: work.id,
      title: work.title,
      slug: work.slug,
      coverId: work.cover_id,
      publishDate: work.publish_date
    }
  }

  const fetchCurrentlyReading = async (userId: string): Promise<CurrentlyReadingWork[]> => {
    const { data, error } = await supabase
      .from('user_books')
      .select('started_on, king_works ( id, title, slug, cover_id )')
      .eq('user_id', userId)
      .eq('currently_reading', true)
      .order('started_on', { ascending: false, nullsFirst: false })

    if (error) throw error

    const rows = data as unknown as {
      started_on: string | null
      king_works: { id: string, title: string, slug: string, cover_id: number | null } | null
    }[]

    return rows
      .filter((row): row is typeof row & { king_works: NonNullable<typeof row.king_works> } => row.king_works !== null)
      .map((row) => ({
        id: row.king_works.id,
        title: row.king_works.title,
        slug: row.king_works.slug,
        coverId: row.king_works.cover_id,
        startedOn: row.started_on
      }))
  }

  // Sorted client-side by coalesce(finished_on, started_on, read_year) since
  // that "most recent date from whichever field is set" logic isn't expressible
  // as a single PostgREST .order() - see supabase-conventions "Building a
  // reading timeline". Accepts a userId like the other profile-stat fetchers.
  // Returns every read work, not a capped page - the horizontal scroller
  // this feeds already handles an arbitrary number of entries.
  const fetchReadingTimeline = async (userId: string): Promise<ReadingTimelineEntry[]> => {
    const { data, error } = await supabase
      .from('user_books')
      .select('finished_on, started_on, read_year, king_works ( id, title, slug, cover_id )')
      .eq('user_id', userId)
      .eq('read', true)

    if (error) throw error

    const rows = data as unknown as {
      finished_on: string | null
      started_on: string | null
      read_year: number | null
      king_works: { id: string, title: string, slug: string, cover_id: number | null } | null
    }[]

    const sortKey = (row: (typeof rows)[number]) =>
      row.finished_on ?? row.started_on ?? (row.read_year ? `${row.read_year}-01-01` : null)

    return rows
      .filter((row): row is typeof row & { king_works: NonNullable<typeof row.king_works> } => row.king_works !== null)
      .sort((a, b) => (sortKey(b) ?? '').localeCompare(sortKey(a) ?? ''))
      .map((row) => ({
        id: row.king_works.id,
        title: row.king_works.title,
        slug: row.king_works.slug,
        coverId: row.king_works.cover_id,
        readOn: row.finished_on ?? row.started_on,
        readYear: row.read_year
      }))
  }

  const toggleWantToRead = async (workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data: existing, error: fetchError } = await supabase
      .from('user_books')
      .select('want_to_read')
      .eq('user_id', user.value.sub)
      .eq('king_work_id', workId)
      .maybeSingle()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('user_books')
      .upsert(
        { user_id: user.value.sub, king_work_id: workId, want_to_read: !existing?.want_to_read },
        { onConflict: 'user_id,king_work_id' }
      )
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  const startReading = async (workId: string, startedOn: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_books')
      .upsert(
        { user_id: user.value.sub, king_work_id: workId, currently_reading: true, started_on: startedOn },
        { onConflict: 'user_id,king_work_id' }
      )
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  const finishReading = async (workId: string, finishedOn: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_books')
      .update({ read: true, finished_on: finishedOn })
      .eq('user_id', user.value.sub)
      .eq('king_work_id', workId)
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  const markRead = async (
    workId: string,
    { startedOn, finishedOn, readYear }: { startedOn?: string, finishedOn?: string, readYear?: number } = {}
  ) => {
    if (!user.value) throw new Error('Not signed in')

    // Explicitly null out any field not supplied, rather than omitting it
    // from the upsert payload - per reading-status's "Marking read with no
    // dates supplied" scenario, confirming with everything blank must leave
    // start date, finish date, and year "all left unset". Omitting the key
    // instead would only skip the *new* value while leaving an existing
    // row's prior started_on/finished_on/read_year (e.g. from an earlier
    // currently-reading session) in place - resurfacing a date the user
    // deliberately didn't provide for this read.
    const { data, error } = await supabase
      .from('user_books')
      .upsert(
        {
          user_id: user.value.sub,
          king_work_id: workId,
          read: true,
          started_on: startedOn ?? null,
          finished_on: finishedOn ?? null,
          read_year: readYear ?? null
        },
        { onConflict: 'user_id,king_work_id' }
      )
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  const unmarkRead = async (workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_books')
      .update({ read: false })
      .eq('user_id', user.value.sub)
      .eq('king_work_id', workId)
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  // Exposed for useBookshelf(), which needs to flip the ownership flag as
  // one half of its two-write add/remove-edition operations - keeps that
  // write inside user_books' own composable rather than useBookshelf calling
  // supabase.from('user_books') directly (see supabase-conventions "one
  // composable per table").
  const setOwned = async (workId: string, owned: boolean) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_books')
      .upsert(
        { user_id: user.value.sub, king_work_id: workId, owned },
        { onConflict: 'user_id,king_work_id' }
      )
      .select(USER_BOOK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserBook
    userBooksByWorkId.value = { ...userBooksByWorkId.value, [workId]: row }

    return row
  }

  return {
    userBooksByWorkId,
    fetchUserBooks,
    fetchWorkStats,
    fetchProfileBookStats,
    fetchCurrentlyReading,
    fetchReadingTimeline,
    fetchWorkHighlights,
    fetchUnreadRecommendation,
    fetchOwnedUnreadRecommendation,
    toggleWantToRead,
    startReading,
    finishReading,
    markRead,
    unmarkRead,
    setOwned
  }
}
