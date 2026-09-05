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

  return { userBooksByWorkId, fetchUserBooks, fetchWorkStats, toggleWantToRead, startReading, finishReading, markRead, unmarkRead }
}
