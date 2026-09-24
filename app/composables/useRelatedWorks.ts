import type { ReadFormat } from '~/composables/useBooks'

export type RelatedWorkCategory = 'comic' | 'reference' | 'tie_in_novel'

export interface RelatedWork {
  id: string
  title: string
  creator: string
  category: RelatedWorkCategory
  publish_date: string | null
  slug: string
  open_library_work_key: string | null
  cover_id: number | null
  description: string | null
  relation_note: string | null
  is_omnibus: boolean
  // Same meaning as KingWork.dark_tower - true for Marvel's Dark Tower comics
  // and omnibuses and the Dark Tower companion books, false for everything
  // else (e.g. Marvel's The Stand comics).
  dark_tower: boolean
}

export interface UserRelatedWork {
  id: string
  user_id: string
  related_work_id: string
  owned: boolean
  want_to_read: boolean
  currently_reading: boolean
  started_on: string | null
  read: boolean
  finished_on: string | null
  note: string | null
  rating: number | null
  // Unlike King, where format is split across two columns (user_books.format
  // for the in-progress session, user_book_reads.format for each logged read
  // - see 20260916120320_add_format_to_user_books.sql), this one column
  // serves both roles here, same as started_on/note/rating already do.
  format: ReadFormat | null
}

export interface RelatedWorkProgress {
  count: number
  total: number
}

export interface RelatedWorkStats {
  want_to_read_count: number
  currently_reading_count: number
  read_count: number
  owner_count: number
}

export interface ComponentWork {
  id: string
  title: string
  slug: string
  cover_id: number | null
  publish_date: string | null
  open_library_work_key: string | null
}

export interface RelatedWorkOmnibusGroup {
  omnibus: RelatedWork
  components: ComponentWork[]
}

// What a King work's detail page needs to list one of its related works.
export interface RelatedWorkSummary {
  id: string
  title: string
  slug: string
  category: RelatedWorkCategory
  cover_id: number | null
  publish_date: string | null
}

// What a related work's detail page needs to list one of the King works it's
// connected to.
export interface RelatedKingWorkSummary {
  id: string
  title: string
  slug: string
  type: string
  cover_id: number | null
  publish_date: string
}

// Powers the profile page's "Works by Others" progress section - see
// profile-showcase's design.md. `comics` covers every comic (category
// 'comic', omnibuses excluded), not just the Dark Tower ones - unlike
// dark-tower.vue's own comicProgress, which additionally filters on
// dark_tower; `overall` mirrors works-by-others/index.vue's unfiltered
// completion figure.
export interface RelatedWorkProfileStats {
  overall: RelatedWorkProgress
  comics: RelatedWorkProgress
}

// Mirrors useBooks().CurrentlyReadingWork one domain over.
export interface CurrentlyReadingRelatedWork {
  id: string
  title: string
  slug: string
  coverId: number | null
  startedOn: string | null
  format: ReadFormat | null
}

// Mirrors useBooks().ReadingTimelineEntry one domain over. There's no
// reread-history table backing this (see markRead's own note: "there's no
// logged-read history here"), so each read related work contributes exactly
// one entry, keyed by the work's own id rather than a separate per-read id -
// and there's no readYear fallback the way a King read has.
export interface ReadingTimelineRelatedEntry {
  workId: string
  title: string
  slug: string
  coverId: number | null
  startedOn: string | null
  readOn: string | null
  note: string | null
  rating: number | null
  format: ReadFormat | null
}

const RELATED_WORK_COLUMNS
  = 'id, title, creator, category, publish_date, slug, open_library_work_key, cover_id, description, relation_note, is_omnibus, dark_tower'

const USER_RELATED_WORK_COLUMNS
  = 'id, user_id, related_work_id, owned, want_to_read, currently_reading, started_on, read, finished_on, note, rating, format'

// See add-by-other-hands's design.md "Why not fold these into
// king_works/user_books with a discriminator column?" - related_works and
// user_related_works are wholly separate tables from king_works/user_books,
// so nothing here ever touches King reading/collection statistics.
export function useRelatedWorks() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const userRelatedWorksByWorkId = useState<Record<string, UserRelatedWork>>(
    'userRelatedWorksByWorkId',
    () => ({})
  )

  // Excludes inactive works, same pattern as useKingWorks().fetchKingWorks.
  const fetchRelatedWorks = async () => {
    const { data, error } = await supabase
      .from('related_works')
      .select(RELATED_WORK_COLUMNS)
      .eq('active', true)
      .order('title', { ascending: true })

    if (error) throw error

    return data as RelatedWork[]
  }

  // An inactive work's slug resolves the same as no match at all, same as
  // useKingWorks().fetchKingWorkBySlug - a detail page built on this 404s
  // automatically without its own inactive check.
  const fetchRelatedWorkBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from('related_works')
      .select(RELATED_WORK_COLUMNS)
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()

    if (error) throw error

    return data as RelatedWork | null
  }

  // The comics collected by an is_omnibus related_work (e.g. "Beginnings" ->
  // Gunslinger Born, Long Road Home, Treachery, Fall of Gilead, Battle of
  // Jericho Hill), via related_work_omnibus_works - mirrors
  // useKingWorks().fetchComponentWorksForOmnibus one join shape over.
  const fetchComponentWorksForOmnibus = async (omnibusRelatedWorkId: string) => {
    const { data, error } = await supabase
      .from('related_work_omnibus_works')
      .select(
        'related_works!related_work_omnibus_works_component_related_work_id_fkey ( id, title, slug, cover_id, publish_date, open_library_work_key )'
      )
      .eq('omnibus_related_work_id', omnibusRelatedWorkId)

    if (error) throw error

    return (data as unknown as { related_works: ComponentWork | null }[])
      .map(row => row.related_works)
      .filter((work): work is ComponentWork => work !== null)
      .sort((a, b) => (a.publish_date ?? '').localeCompare(b.publish_date ?? ''))
  }

  // Every omnibus in a category, each paired with the works it collects -
  // powers the Dark Tower page's Graphic Novels section (one round trip per
  // omnibus for its components, acceptable at the handful-of-omnibuses scale
  // this app has). Reuses fetchComponentWorksForOmnibus rather than a single
  // bigger join, keeping that one query as the sole place the
  // related_work_omnibus_works join is written. `darkTower: true` narrows to
  // Dark Tower omnibuses only, so the Dark Tower page doesn't list e.g.
  // Marvel's The Stand omnibus.
  const fetchOmnibusesWithComponents = async (
    category: RelatedWorkCategory,
    { darkTower }: { darkTower?: boolean } = {}
  ): Promise<RelatedWorkOmnibusGroup[]> => {
    let query = supabase
      .from('related_works')
      .select(RELATED_WORK_COLUMNS)
      .eq('active', true)
      .eq('category', category)
      .eq('is_omnibus', true)

    if (darkTower !== undefined) query = query.eq('dark_tower', darkTower)

    const { data, error } = await query.order('publish_date', { ascending: true })

    if (error) throw error

    const omnibuses = data as RelatedWork[]

    return Promise.all(
      omnibuses.map(async omnibus => ({
        omnibus,
        components: await fetchComponentWorksForOmnibus(omnibus.id)
      }))
    )
  }

  // The related works connected to a King work, via related_work_king_works -
  // the "Related Works" section on /works/[slug], the same role
  // useAdaptations().fetchAdaptationsForWork plays for adaptations. `!inner`
  // plus the active filter drops a link to an inactive related work entirely,
  // rather than returning it with a null embed.
  const fetchRelatedWorksForKingWork = async (kingWorkId: string) => {
    const { data, error } = await supabase
      .from('related_work_king_works')
      .select('related_works!inner ( id, title, slug, category, cover_id, publish_date )')
      .eq('king_work_id', kingWorkId)
      .eq('related_works.active', true)

    if (error) throw error

    return (data as unknown as { related_works: RelatedWorkSummary }[])
      .map(row => row.related_works)
      .sort((a, b) => (a.publish_date ?? '').localeCompare(b.publish_date ?? ''))
  }

  // The reverse of fetchRelatedWorksForKingWork: the King works a related work
  // is connected to, for the "Related Works" section on
  // /works-by-others/[slug].
  const fetchKingWorksForRelatedWork = async (relatedWorkId: string) => {
    const { data, error } = await supabase
      .from('related_work_king_works')
      .select('king_works!inner ( id, title, slug, type, cover_id, publish_date )')
      .eq('related_work_id', relatedWorkId)
      .eq('king_works.active', true)

    if (error) throw error

    return (data as unknown as { king_works: RelatedKingWorkSummary }[])
      .map(row => row.king_works)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  // Mirrors useBooks().fetchWorkStats, against related_work_stats instead of
  // work_stats - see the migration creating that view.
  const fetchRelatedWorkStats = async (workId: string) => {
    const { data, error } = await supabase
      .from('related_work_stats')
      .select('want_to_read_count, currently_reading_count, read_count, owner_count')
      .eq('related_work_id', workId)
      .maybeSingle()

    if (error) throw error

    return data as RelatedWorkStats | null
  }

  // Mirrors useBooks().fetchProfileBookStats one domain over - two figures
  // instead of King's four, since related works only have one flat category
  // set plus the Dark Tower comics carve-out the dark-tower page already
  // shows. Accepts a userId rather than assuming the signed-in user so it
  // can power both the owner's own profile and a public profile's, same as
  // useBooks()'s profile-stat fetchers. Omnibuses are excluded from both
  // denominators for the same reason King's own omnibuses are excluded from
  // fetchProfileBookStats - marking one read cascades to its components,
  // which are already counted individually.
  const fetchRelatedWorkProfileStats = async (userId: string): Promise<RelatedWorkProfileStats> => {
    const [{ data: works, error: worksError }, { data: userRows, error: rowsError }] = await Promise.all([
      supabase.from('related_works').select('id, category, is_omnibus').eq('active', true),
      supabase.from('user_related_works').select('related_work_id, read').eq('user_id', userId)
    ])

    if (worksError) throw worksError
    if (rowsError) throw rowsError

    const eligibleWorks = (works as { id: string, category: RelatedWorkCategory, is_omnibus: boolean }[])
      .filter(work => !work.is_omnibus)
    const readWorkIds = new Set(
      (userRows as { related_work_id: string, read: boolean }[])
        .filter(row => row.read)
        .map(row => row.related_work_id)
    )

    const progressFor = (subset: typeof eligibleWorks): RelatedWorkProgress => ({
      count: subset.filter(work => readWorkIds.has(work.id)).length,
      total: subset.length
    })

    return {
      overall: progressFor(eligibleWorks),
      comics: progressFor(eligibleWorks.filter(work => work.category === 'comic'))
    }
  }

  // Mirrors useBooks().fetchCurrentlyReading one domain over - reads straight
  // off user_related_works rather than a separate reads-log table (there
  // isn't one here, see markRead's note below), so each related work can
  // only be "currently reading" once at a time either way.
  const fetchCurrentlyReadingRelatedWorks = async (userId: string): Promise<CurrentlyReadingRelatedWork[]> => {
    const { data, error } = await supabase
      .from('user_related_works')
      .select(
        'started_on, format, related_works!user_related_works_related_work_id_fkey ( id, title, slug, cover_id, active )'
      )
      .eq('user_id', userId)
      .eq('currently_reading', true)
      .order('started_on', { ascending: false, nullsFirst: false })

    if (error) throw error

    const rows = data as unknown as {
      started_on: string | null
      format: ReadFormat | null
      related_works: { id: string, title: string, slug: string, cover_id: number | null, active: boolean } | null
    }[]

    return rows
      .filter(
        (row): row is typeof row & { related_works: NonNullable<typeof row.related_works> } =>
          row.related_works !== null && row.related_works.active
      )
      .map(row => ({
        id: row.related_works.id,
        title: row.related_works.title,
        slug: row.related_works.slug,
        coverId: row.related_works.cover_id,
        startedOn: row.started_on,
        format: row.format
      }))
  }

  // Mirrors useBooks().fetchReadingTimeline one domain over, reading straight
  // off user_related_works rather than a reread-history table - see
  // markRead's own note: "there's no logged-read history here". Excludes a
  // row whose read=true only came from cascade_related_work_reads_on_omnibus_read()
  // marking it alongside its omnibus (via_omnibus_id not null) - otherwise
  // reading one omnibus would flood the timeline with every comic it
  // collects, none of which the user actually read on their own. King's own
  // timeline never has this problem since its cascade only ever updates
  // user_books, not user_book_reads (the table its timeline is built from) -
  // there's no equivalent second table here to keep the two apart, so the
  // distinction has to be made explicitly via this column instead.
  const fetchReadingTimelineRelatedWorks = async (userId: string): Promise<ReadingTimelineRelatedEntry[]> => {
    const { data, error } = await supabase
      .from('user_related_works')
      .select(
        'started_on, finished_on, note, rating, format, related_works!user_related_works_related_work_id_fkey ( id, title, slug, cover_id, active )'
      )
      .eq('user_id', userId)
      .eq('read', true)
      .is('via_omnibus_id', null)

    if (error) throw error

    const rows = data as unknown as {
      started_on: string | null
      finished_on: string | null
      note: string | null
      rating: number | null
      format: ReadFormat | null
      related_works: { id: string, title: string, slug: string, cover_id: number | null, active: boolean } | null
    }[]

    return rows
      .filter(
        (row): row is typeof row & { related_works: NonNullable<typeof row.related_works> } =>
          row.related_works !== null && row.related_works.active
      )
      .map(row => ({
        workId: row.related_works.id,
        title: row.related_works.title,
        slug: row.related_works.slug,
        coverId: row.related_works.cover_id,
        startedOn: row.started_on,
        readOn: row.finished_on,
        note: row.note,
        rating: row.rating,
        format: row.format
      }))
  }

  const fetchUserRelatedWorks = async () => {
    if (!user.value) {
      userRelatedWorksByWorkId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from('user_related_works')
      .select(USER_RELATED_WORK_COLUMNS)
      .eq('user_id', user.value.sub)

    if (error) throw error

    const rows = data as UserRelatedWork[]
    userRelatedWorksByWorkId.value = Object.fromEntries(
      rows.map(row => [row.related_work_id, row])
    )

    return rows
  }

  // Client-side, over an already-fetched list - see design.md "Completion
  // count is a plain client-side count over already-fetched data".
  const computeCompletionCount = (works: RelatedWork[]): RelatedWorkProgress => {
    const readWorkIds = new Set(
      Object.values(userRelatedWorksByWorkId.value)
        .filter(row => row.read)
        .map(row => row.related_work_id)
    )

    return {
      count: works.filter(work => readWorkIds.has(work.id)).length,
      total: works.length
    }
  }

  const setOwned = async (workId: string, owned: boolean) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_related_works')
      .upsert(
        { user_id: user.value.sub, related_work_id: workId, owned },
        { onConflict: 'user_id,related_work_id' }
      )
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  const toggleWantToRead = async (workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const existing = userRelatedWorksByWorkId.value[workId]

    const { data, error } = await supabase
      .from('user_related_works')
      .upsert(
        { user_id: user.value.sub, related_work_id: workId, want_to_read: !existing?.want_to_read },
        { onConflict: 'user_id,related_work_id' }
      )
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  // currently_reading: true clears want_to_read via
  // clear_read_states_on_progress() - see supabase-conventions "Triggers".
  const startReading = async (workId: string, startedOn: string, format?: ReadFormat) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_related_works')
      .upsert(
        {
          user_id: user.value.sub,
          related_work_id: workId,
          currently_reading: true,
          started_on: startedOn,
          format: format ?? null
        },
        { onConflict: 'user_id,related_work_id' }
      )
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  // read: true clears both want_to_read and currently_reading via
  // clear_read_states_on_progress() - see supabase-conventions "Triggers".
  // All fields are optional and independently skippable, same as King's
  // mark-read-directly flow. Each field not supplied is explicitly nulled
  // out (not omitted) - since there's no logged-read history here (see
  // design.md Non-Goals), this row's note/rating/format/dates always
  // describe only the most recent mark-read action, same reasoning as
  // useBooks().markRead for started_on/finished_on/read_year.
  const markRead = async (
    workId: string,
    { startedOn, finishedOn, note, rating, format }: {
      startedOn?: string
      finishedOn?: string
      note?: string
      rating?: number
      format?: ReadFormat
    } = {}
  ) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_related_works')
      .upsert(
        {
          user_id: user.value.sub,
          related_work_id: workId,
          read: true,
          started_on: startedOn ?? null,
          finished_on: finishedOn ?? null,
          note: note ?? null,
          rating: rating ?? null,
          format: format ?? null
        },
        { onConflict: 'user_id,related_work_id' }
      )
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  // Abandons an in-progress reading session without touching whatever
  // read/finished_on this row already had - the related-domain equivalent
  // of useBooks().stopReading(), used by BookFinishReadingModal's "Stop
  // Reading" when domain="related". Unlike King, there's no per-read history
  // table to resync started_on/finished_on/read_year from here (see
  // markRead's own "no logged-read history" note) - if this session was a
  // reread of an already-`read` work, startReading() already overwrote
  // started_on with this session's date and that original date can't be
  // recovered, so it's left as-is rather than guessed at. Only a
  // never-before-read work gets a full reset back to neutral, the one case
  // where the correct target state is unambiguous.
  const stopReading = async (workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data: existing, error: fetchError } = await supabase
      .from('user_related_works')
      .select('read')
      .eq('user_id', user.value.sub)
      .eq('related_work_id', workId)
      .maybeSingle()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('user_related_works')
      .update(
        existing?.read
          ? { currently_reading: false }
          : { currently_reading: false, started_on: null, finished_on: null }
      )
      .eq('user_id', user.value.sub)
      .eq('related_work_id', workId)
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  // Simple toggle-off, unlike King books' confirm-then-delete unmark flow -
  // there's no logged-read history here to cascade-delete (see design.md
  // "Non-Goals: Full reread history"), so undoing a mis-click is a single
  // plain update.
  const unmarkRead = async (workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_related_works')
      .update({ read: false, started_on: null, finished_on: null })
      .eq('user_id', user.value.sub)
      .eq('related_work_id', workId)
      .select(USER_RELATED_WORK_COLUMNS)
      .single()

    if (error) throw error

    const row = data as UserRelatedWork
    userRelatedWorksByWorkId.value = { ...userRelatedWorksByWorkId.value, [workId]: row }

    return row
  }

  return {
    userRelatedWorksByWorkId,
    fetchRelatedWorks,
    fetchRelatedWorkBySlug,
    fetchComponentWorksForOmnibus,
    fetchOmnibusesWithComponents,
    fetchRelatedWorksForKingWork,
    fetchKingWorksForRelatedWork,
    fetchRelatedWorkStats,
    fetchRelatedWorkProfileStats,
    fetchCurrentlyReadingRelatedWorks,
    fetchReadingTimelineRelatedWorks,
    fetchUserRelatedWorks,
    computeCompletionCount,
    setOwned,
    toggleWantToRead,
    startReading,
    stopReading,
    markRead,
    unmarkRead
  }
}
