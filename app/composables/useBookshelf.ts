import type { WorkKind } from '~/utils/workPath'

export interface UserBookEdition {
  id: string
  user_id: string
  work_id: string
  edition_id: string
  edition_title: string
  added_at: string
}

const USER_BOOK_EDITION_COLUMNS = 'id, user_id, work_id, edition_id, edition_title, added_at'

// One tile per added edition, plus one fallback-cover tile per work marked
// owned with zero editions picked - King and related works alike, see
// profile-showcase "Bookshelf and reading timeline always include By Other
// Hands works" - see design.md "Tile count = total
// tiles rendered". `kind` tells a bookshelf tile which cover-resolution path
// to use (an edition cover, falling back to the work's cover, vs. the
// work-level fallback directly). Both kinds carry openLibraryWorkKey and
// publishDate - an edition tile needs the former for its own cover fallback
// (see design.md "Edition tiles fall back to the work's cover"), and both
// need publishDate for the Bookshelf's release-year sort.
// seriesId/seriesName/seriesPosition are null for a work with no series
// membership. Populated from useSeries().seriesByWorkId - see design.md
// "One useSeries composable, consumed by useBookshelf". `workKind` (not to be
// confused with the tile's own `kind`) picks the work's detail page via
// workPath().
export interface BookshelfEditionItem {
  kind: 'edition'
  editionRowId: string
  workId: string
  workSlug: string
  workTitle: string
  workKind: WorkKind
  publishDate: string
  openLibraryWorkKey: string | null
  editionId: string
  editionTitle: string
  seriesId: string | null
  seriesName: string | null
  seriesPosition: number | null
}

export interface BookshelfWorkItem {
  kind: 'work'
  workId: string
  workSlug: string
  workTitle: string
  workKind: WorkKind
  publishDate: string
  openLibraryWorkKey: string | null
  seriesId: string | null
  seriesName: string | null
  seriesPosition: number | null
}

export type BookshelfItem = BookshelfEditionItem | BookshelfWorkItem

interface WorkRef {
  id: string
  kind: WorkKind
  title: string
  slug: string
  publish_date: string
  open_library_work_key: string | null
  active: boolean
}

export function useBookshelf() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { setOwned } = useBooks()

  // Map of work_id -> the set of that work's edition_ids the signed-in
  // user has added, mirroring useBooks()'s userBooksByWorkId shape/pattern -
  // see design.md "One toggle component, three call sites".
  const userEditionsByWorkId = useState<Record<string, Set<string>>>('userEditionsByWorkId', () => ({}))
  const { loaded: userEditionsLoaded, markLoaded: markUserEditionsLoaded } = useViewerStoreLoaded('userEditions')

  const fetchUserEditions = async () => {
    if (!user.value) {
      userEditionsByWorkId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from('user_book_editions')
      .select(USER_BOOK_EDITION_COLUMNS)
      .eq('user_id', user.value.sub)

    if (error) throw error

    const rows = data as UserBookEdition[]
    const grouped: Record<string, Set<string>> = {}
    for (const row of rows) {
      const existing = grouped[row.work_id] ?? new Set<string>()
      existing.add(row.edition_id)
      grouped[row.work_id] = existing
    }
    userEditionsByWorkId.value = grouped
    markUserEditionsLoaded(user.value.sub)

    return rows
  }

  const isEditionAdded = (workId: string, editionId: string) =>
    userEditionsByWorkId.value[workId]?.has(editionId) ?? false

  // Two-write operation: record the edition, then mark the work owned - see
  // supabase-conventions "user_book_editions" and design.md "One toggle
  // component, three call sites". The owned write is delegated to
  // useBooks().setOwned rather than written here, keeping user_books writes
  // inside its own composable.
  const addEdition = async (workId: string, edition: { key: string, title: string }) => {
    if (!user.value) throw new Error('Not signed in')

    const { error: editionError } = await supabase
      .from('user_book_editions')
      .insert({
        user_id: user.value.sub,
        work_id: workId,
        edition_id: edition.key,
        edition_title: edition.title
      })

    if (editionError) throw editionError

    const nextSet = new Set(userEditionsByWorkId.value[workId] ?? [])
    nextSet.add(edition.key)
    userEditionsByWorkId.value = { ...userEditionsByWorkId.value, [workId]: nextSet }

    await setOwned(workId, true)
  }

  // Removing a work's last edition un-owns it - see design.md "Ownership-
  // clearing lives in the composable, not a DB trigger". Removing one of
  // several editions leaves owned untouched.
  const removeEdition = async (workId: string, editionId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { error: editionError } = await supabase
      .from('user_book_editions')
      .delete()
      .eq('user_id', user.value.sub)
      .eq('work_id', workId)
      .eq('edition_id', editionId)

    if (editionError) throw editionError

    const nextSet = new Set(userEditionsByWorkId.value[workId] ?? [])
    nextSet.delete(editionId)
    userEditionsByWorkId.value = { ...userEditionsByWorkId.value, [workId]: nextSet }

    if (nextSet.size === 0) {
      await setOwned(workId, false)
    }
  }

  // Powers the profile Bookshelf grid - every edition row plus every owned
  // work with no matching edition row, per profile-showcase's "Bookshelf
  // shows the profile owner's collection" requirement. Accepts a userId
  // rather than assuming the signed-in user so it can power both the
  // owner's own bookshelf and a public profile's, same as useBooks()'s
  // profile-stat fetchers.
  const fetchBookshelf = async (userId: string): Promise<BookshelfItem[]> => {
    const { seriesByWorkId, fetchAllSeries } = useSeries()

    const [{ data: editionRows, error: editionsError }, { data: ownedRows, error: ownedError }] = await Promise.all([
      supabase
        .from('user_book_editions')
        .select(
          'id, edition_id, edition_title, works ( id, kind, title, slug, publish_date, open_library_work_key, active )'
        )
        .eq('user_id', userId),
      supabase
        .from('user_books')
        .select('works!user_books_work_id_fkey ( id, kind, title, slug, publish_date, open_library_work_key, active )')
        .eq('user_id', userId)
        .eq('owned', true),
      fetchAllSeries()
    ])

    if (editionsError) throw editionsError
    if (ownedError) throw ownedError

    const seriesFieldsFor = (workId: string) => {
      const membership = seriesByWorkId.value[workId]
      return membership
        ? { seriesId: membership.seriesId, seriesName: membership.seriesName, seriesPosition: membership.position }
        : { seriesId: null, seriesName: null, seriesPosition: null }
    }

    const editionItems: BookshelfEditionItem[] = (
      editionRows as unknown as {
        id: string
        edition_id: string
        edition_title: string
        works: WorkRef | null
      }[]
    )
      .filter(
        (row): row is typeof row & { works: WorkRef } => row.works !== null && row.works.active
      )
      .map(row => ({
        kind: 'edition',
        editionRowId: row.id,
        workId: row.works.id,
        workSlug: row.works.slug,
        workTitle: row.works.title,
        workKind: row.works.kind,
        publishDate: row.works.publish_date,
        openLibraryWorkKey: row.works.open_library_work_key,
        editionId: row.edition_id,
        editionTitle: row.edition_title,
        ...seriesFieldsFor(row.works.id)
      }))

    const workIdsWithEditions = new Set(editionItems.map(item => item.workId))

    const workItems: BookshelfWorkItem[] = (
      ownedRows as unknown as { works: WorkRef | null }[]
    )
      .filter(
        (row): row is typeof row & { works: WorkRef } => row.works !== null && row.works.active
      )
      .filter(row => !workIdsWithEditions.has(row.works.id))
      .map(row => ({
        kind: 'work',
        workId: row.works.id,
        workSlug: row.works.slug,
        workTitle: row.works.title,
        workKind: row.works.kind,
        publishDate: row.works.publish_date,
        openLibraryWorkKey: row.works.open_library_work_key,
        ...seriesFieldsFor(row.works.id)
      }))

    return [...editionItems, ...workItems].sort((a, b) => a.workTitle.localeCompare(b.workTitle))
  }

  return {
    userEditionsByWorkId,
    userEditionsLoaded,
    fetchUserEditions,
    isEditionAdded,
    addEdition,
    removeEdition,
    fetchBookshelf
  }
}
