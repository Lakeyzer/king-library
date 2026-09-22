export interface UserRelatedWorkEdition {
  id: string
  user_id: string
  related_work_id: string
  edition_id: string
  edition_title: string
  added_at: string
}

const USER_RELATED_WORK_EDITION_COLUMNS = 'id, user_id, related_work_id, edition_id, edition_title, added_at'

// Mirrors useBookshelf()'s BookshelfEditionItem/BookshelfWorkItem one domain
// over - no seriesId/seriesName/seriesPosition here, since related works
// have no series concept (see useRelatedWorks.ts's RelatedWork).
export interface RelatedWorkBookshelfEditionItem {
  kind: 'edition'
  editionRowId: string
  workId: string
  workSlug: string
  workTitle: string
  publishDate: string | null
  openLibraryWorkKey: string | null
  editionId: string
  editionTitle: string
}

export interface RelatedWorkBookshelfWorkItem {
  kind: 'work'
  workId: string
  workSlug: string
  workTitle: string
  publishDate: string | null
  openLibraryWorkKey: string | null
}

export type RelatedWorkBookshelfItem = RelatedWorkBookshelfEditionItem | RelatedWorkBookshelfWorkItem

interface RelatedWorkRef {
  id: string
  title: string
  slug: string
  publish_date: string | null
  open_library_work_key: string | null
  active: boolean
}

// Mirrors useBookshelf() one domain over, against user_related_work_editions
// instead of user_book_editions - see supabase-conventions "user_book_editions".
export function useRelatedWorkEditions() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { setOwned } = useRelatedWorks()

  const userEditionsByWorkId = useState<Record<string, Set<string>>>('userRelatedWorkEditionsByWorkId', () => ({}))

  const fetchUserEditions = async () => {
    if (!user.value) {
      userEditionsByWorkId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from('user_related_work_editions')
      .select(USER_RELATED_WORK_EDITION_COLUMNS)
      .eq('user_id', user.value.sub)

    if (error) throw error

    const rows = data as UserRelatedWorkEdition[]
    const grouped: Record<string, Set<string>> = {}
    for (const row of rows) {
      const existing = grouped[row.related_work_id] ?? new Set<string>()
      existing.add(row.edition_id)
      grouped[row.related_work_id] = existing
    }
    userEditionsByWorkId.value = grouped

    return rows
  }

  const isEditionAdded = (workId: string, editionId: string) =>
    userEditionsByWorkId.value[workId]?.has(editionId) ?? false

  // Two-write operation, same shape as useBookshelf().addEdition: record the
  // edition, then mark the work owned via useRelatedWorks().setOwned rather
  // than writing user_related_works here directly.
  const addEdition = async (workId: string, edition: { key: string, title: string }) => {
    if (!user.value) throw new Error('Not signed in')

    const { error: editionError } = await supabase
      .from('user_related_work_editions')
      .insert({
        user_id: user.value.sub,
        related_work_id: workId,
        edition_id: edition.key,
        edition_title: edition.title
      })

    if (editionError) throw editionError

    const nextSet = new Set(userEditionsByWorkId.value[workId] ?? [])
    nextSet.add(edition.key)
    userEditionsByWorkId.value = { ...userEditionsByWorkId.value, [workId]: nextSet }

    await setOwned(workId, true)
  }

  // Removing a work's last edition un-owns it, same as useBookshelf().removeEdition.
  const removeEdition = async (workId: string, editionId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { error: editionError } = await supabase
      .from('user_related_work_editions')
      .delete()
      .eq('user_id', user.value.sub)
      .eq('related_work_id', workId)
      .eq('edition_id', editionId)

    if (editionError) throw editionError

    const nextSet = new Set(userEditionsByWorkId.value[workId] ?? [])
    nextSet.delete(editionId)
    userEditionsByWorkId.value = { ...userEditionsByWorkId.value, [workId]: nextSet }

    if (nextSet.size === 0) {
      await setOwned(workId, false)
    }
  }

  // Mirrors useBookshelf().fetchBookshelf one domain over - every edition
  // row plus every owned related work with no matching edition row. Accepts
  // a userId rather than assuming the signed-in user so it can power both
  // the owner's own profile and a public profile's, same as
  // useBookshelf()'s own fetcher.
  const fetchBookshelf = async (userId: string): Promise<RelatedWorkBookshelfItem[]> => {
    const [{ data: editionRows, error: editionsError }, { data: ownedRows, error: ownedError }] = await Promise.all([
      supabase
        .from('user_related_work_editions')
        .select(
          'id, edition_id, edition_title, related_works!user_related_work_editions_related_work_id_fkey ( id, title, slug, publish_date, open_library_work_key, active )'
        )
        .eq('user_id', userId),
      supabase
        .from('user_related_works')
        .select(
          'related_works!user_related_works_related_work_id_fkey ( id, title, slug, publish_date, open_library_work_key, active )'
        )
        .eq('user_id', userId)
        .eq('owned', true)
    ])

    if (editionsError) throw editionsError
    if (ownedError) throw ownedError

    const editionItems: RelatedWorkBookshelfEditionItem[] = (
      editionRows as unknown as {
        id: string
        edition_id: string
        edition_title: string
        related_works: RelatedWorkRef | null
      }[]
    )
      .filter(
        (row): row is typeof row & { related_works: RelatedWorkRef } =>
          row.related_works !== null && row.related_works.active
      )
      .map(row => ({
        kind: 'edition',
        editionRowId: row.id,
        workId: row.related_works.id,
        workSlug: row.related_works.slug,
        workTitle: row.related_works.title,
        publishDate: row.related_works.publish_date,
        openLibraryWorkKey: row.related_works.open_library_work_key,
        editionId: row.edition_id,
        editionTitle: row.edition_title
      }))

    const workIdsWithEditions = new Set(editionItems.map(item => item.workId))

    const workItems: RelatedWorkBookshelfWorkItem[] = (
      ownedRows as unknown as { related_works: RelatedWorkRef | null }[]
    )
      .filter(
        (row): row is typeof row & { related_works: RelatedWorkRef } =>
          row.related_works !== null && row.related_works.active
      )
      .filter(row => !workIdsWithEditions.has(row.related_works.id))
      .map(row => ({
        kind: 'work',
        workId: row.related_works.id,
        workSlug: row.related_works.slug,
        workTitle: row.related_works.title,
        publishDate: row.related_works.publish_date,
        openLibraryWorkKey: row.related_works.open_library_work_key
      }))

    return [...editionItems, ...workItems].sort((a, b) => a.workTitle.localeCompare(b.workTitle))
  }

  return {
    userEditionsByWorkId,
    fetchUserEditions,
    isEditionAdded,
    addEdition,
    removeEdition,
    fetchBookshelf
  }
}
