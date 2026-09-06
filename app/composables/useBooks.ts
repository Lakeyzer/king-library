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
  const fetchReadingTimeline = async (userId: string, limit = 8): Promise<ReadingTimelineEntry[]> => {
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
      .slice(0, limit)
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

    const { data, error } = await supabase
      .from('user_books')
      .upsert(
        {
          user_id: user.value.sub,
          king_work_id: workId,
          read: true,
          ...(startedOn !== undefined && { started_on: startedOn }),
          ...(finishedOn !== undefined && { finished_on: finishedOn }),
          ...(readYear !== undefined && { read_year: readYear })
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

  return {
    userBooksByWorkId,
    fetchUserBooks,
    fetchWorkStats,
    fetchProfileBookStats,
    fetchCurrentlyReading,
    fetchReadingTimeline,
    toggleWantToRead,
    startReading,
    finishReading,
    markRead,
    unmarkRead
  }
}
