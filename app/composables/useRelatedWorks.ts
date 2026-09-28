export type RelatedWorkCategory = 'comic' | 'reference' | 'tie_in_novel'

export interface RelatedWork {
  id: string
  title: string
  creator: string
  category: RelatedWorkCategory
  publish_date: string
  slug: string
  open_library_work_key: string | null
  cover_id: number | null
  description: string | null
  relation_note: string | null
  // Derived from works.type = 'omnibus' (see toRelatedWork) - kept as a flag
  // so templates don't need to know how the works table spells it.
  is_omnibus: boolean
  // Same meaning as KingWork.dark_tower - true for Marvel's Dark Tower comics
  // and omnibuses and the Dark Tower companion books, false for everything
  // else (e.g. Marvel's The Stand comics).
  dark_tower: boolean
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
  publish_date: string
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
  publish_date: string
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

interface RelatedWorkRow extends Omit<RelatedWork, 'is_omnibus'> {
  type: string | null
}

const RELATED_WORK_COLUMNS
  = 'id, title, creator, category, publish_date, slug, open_library_work_key, cover_id, description, relation_note, type, dark_tower'

function toRelatedWork({ type, ...row }: RelatedWorkRow): RelatedWork {
  return { ...row, is_omnibus: type === 'omnibus' }
}

// Catalog reads for By Other Hands works: the works rows labelled
// kind = 'related' (see workPath.ts's WorkKind). Every query here filters on
// that label, so a King work never shows up on a Works by Others page.
// Tracking a related work (owned, reading status, editions, logged reads)
// goes through useBooks()/useBookshelf() exactly like a King work - see
// merge-related-works-into-works's design.md.
export function useRelatedWorks() {
  const supabase = useSupabaseClient()
  const { userBooksByWorkId } = useBooks()

  // Excludes inactive works, same pattern as useKingWorks().fetchKingWorks.
  const fetchRelatedWorks = async () => {
    const { data, error } = await supabase
      .from('works')
      .select(RELATED_WORK_COLUMNS)
      .eq('kind', 'related')
      .eq('active', true)
      .order('title', { ascending: true })

    if (error) throw error

    return (data as RelatedWorkRow[]).map(toRelatedWork)
  }

  // An inactive work's slug, or a King work's, resolves the same as no match
  // at all, same as useKingWorks().fetchKingWorkBySlug - a detail page built
  // on this 404s automatically without its own checks.
  const fetchRelatedWorkBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from('works')
      .select(RELATED_WORK_COLUMNS)
      .eq('kind', 'related')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()

    if (error) throw error

    return data ? toRelatedWork(data as RelatedWorkRow) : null
  }

  // The comics collected by a related omnibus (e.g. "Beginnings" ->
  // Gunslinger Born, Long Road Home, Treachery, Fall of Gilead, Battle of
  // Jericho Hill), via work_omnibus_works - the same link table
  // useKingWorks().fetchComponentWorksForOmnibus reads for King omnibuses.
  const fetchComponentWorksForOmnibus = async (omnibusWorkId: string) => {
    const { data, error } = await supabase
      .from('work_omnibus_works')
      .select(
        'works!work_omnibus_works_component_work_id_fkey ( id, title, slug, cover_id, publish_date, open_library_work_key )'
      )
      .eq('omnibus_work_id', omnibusWorkId)

    if (error) throw error

    return (data as unknown as { works: ComponentWork | null }[])
      .map(row => row.works)
      .filter((work): work is ComponentWork => work !== null)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  // Every omnibus in a category, each paired with the works it collects -
  // powers the Dark Tower page's Graphic Novels section (one round trip per
  // omnibus for its components, acceptable at the handful-of-omnibuses scale
  // this app has). Reuses fetchComponentWorksForOmnibus rather than a single
  // bigger join, keeping that one query as the sole place the
  // work_omnibus_works join is written here. `darkTower: true` narrows to
  // Dark Tower omnibuses only, so the Dark Tower page doesn't list e.g.
  // Marvel's The Stand omnibus.
  const fetchOmnibusesWithComponents = async (
    category: RelatedWorkCategory,
    { darkTower }: { darkTower?: boolean } = {}
  ): Promise<RelatedWorkOmnibusGroup[]> => {
    let query = supabase
      .from('works')
      .select(RELATED_WORK_COLUMNS)
      .eq('kind', 'related')
      .eq('active', true)
      .eq('category', category)
      .eq('type', 'omnibus')

    if (darkTower !== undefined) query = query.eq('dark_tower', darkTower)

    const { data, error } = await query.order('publish_date', { ascending: true })

    if (error) throw error

    const omnibuses = (data as RelatedWorkRow[]).map(toRelatedWork)

    return Promise.all(
      omnibuses.map(async omnibus => ({
        omnibus,
        components: await fetchComponentWorksForOmnibus(omnibus.id)
      }))
    )
  }

  // The related works connected to a King work, via related_work_king_works -
  // the "Related Works" section on /works/[slug], the same role
  // useAdaptations().fetchAdaptationsForWork plays for adaptations. Both of
  // that table's columns reference works, so the embed names its FK.
  // `!inner` plus the active filter drops a link to an inactive related work
  // entirely, rather than returning it with a null embed.
  const fetchRelatedWorksForKingWork = async (kingWorkId: string) => {
    const { data, error } = await supabase
      .from('related_work_king_works')
      .select(
        'works!related_work_king_works_related_work_id_fkey!inner ( id, title, slug, category, cover_id, publish_date, active )'
      )
      .eq('king_work_id', kingWorkId)
      .eq('works.active', true)

    if (error) throw error

    return (data as unknown as { works: RelatedWorkSummary }[])
      .map(row => row.works)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  // The reverse of fetchRelatedWorksForKingWork: the King works a related work
  // is connected to, for the "Related Works" section on
  // /works-by-others/[slug].
  const fetchKingWorksForRelatedWork = async (relatedWorkId: string) => {
    const { data, error } = await supabase
      .from('related_work_king_works')
      .select('works!related_work_king_works_king_work_id_fkey!inner ( id, title, slug, type, cover_id, publish_date, active )')
      .eq('related_work_id', relatedWorkId)
      .eq('works.active', true)

    if (error) throw error

    return (data as unknown as { works: RelatedKingWorkSummary }[])
      .map(row => row.works)
      .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
  }

  // work_stats covers both kinds, so a related work's detail page reads its
  // own row the same way a King work's does - it's only the King
  // leaderboards and totals that filter work_stats down to kind = 'king'.
  const fetchRelatedWorkStats = async (workId: string) => {
    const { data, error } = await supabase
      .from('work_stats')
      .select('want_to_read_count, currently_reading_count, read_count, owner_count')
      .eq('work_id', workId)
      .maybeSingle()

    if (error) throw error

    return data as RelatedWorkStats | null
  }

  // Mirrors useBooks().fetchProfileBookStats one kind over - two figures
  // instead of King's four, since related works only have one flat category
  // set plus the Dark Tower comics carve-out the dark-tower page already
  // shows. Accepts a userId rather than assuming the signed-in user so it
  // can power both the owner's own profile and a public profile's, same as
  // useBooks()'s profile-stat fetchers. Omnibuses are excluded from both
  // denominators for the same reason King's own omnibuses are excluded from
  // fetchProfileBookStats - marking one read cascades to its components,
  // which are already counted individually. The user_books rows cover both
  // kinds; only the ones matching a related work below count.
  const fetchRelatedWorkProfileStats = async (userId: string): Promise<RelatedWorkProfileStats> => {
    const [{ data: works, error: worksError }, { data: userRows, error: rowsError }] = await Promise.all([
      supabase.from('works').select('id, category, type').eq('kind', 'related').eq('active', true),
      supabase.from('user_books').select('work_id, read').eq('user_id', userId).eq('read', true)
    ])

    if (worksError) throw worksError
    if (rowsError) throw rowsError

    const eligibleWorks = (works as { id: string, category: RelatedWorkCategory, type: string | null }[])
      .filter(work => work.type !== 'omnibus')
    const readWorkIds = new Set((userRows as { work_id: string }[]).map(row => row.work_id))

    const progressFor = (subset: typeof eligibleWorks): RelatedWorkProgress => ({
      count: subset.filter(work => readWorkIds.has(work.id)).length,
      total: subset.length
    })

    return {
      overall: progressFor(eligibleWorks),
      comics: progressFor(eligibleWorks.filter(work => work.category === 'comic'))
    }
  }

  // Client-side, over an already-fetched list and the signed-in user's own
  // useBooks().userBooksByWorkId - see design.md "Completion count is a plain
  // client-side count over already-fetched data".
  const computeCompletionCount = (works: { id: string }[]): RelatedWorkProgress => ({
    count: works.filter(work => userBooksByWorkId.value[work.id]?.read).length,
    total: works.length
  })

  return {
    fetchRelatedWorks,
    fetchRelatedWorkBySlug,
    fetchComponentWorksForOmnibus,
    fetchOmnibusesWithComponents,
    fetchRelatedWorksForKingWork,
    fetchKingWorksForRelatedWork,
    fetchRelatedWorkStats,
    fetchRelatedWorkProfileStats,
    computeCompletionCount
  }
}
