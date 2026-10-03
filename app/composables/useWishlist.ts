import type { WorkKind } from '~/utils/workPath'
import { WISHLIST_PRESET_TAGS, normalizeWishlistTags } from '~/utils/wishlistTags'

// One row of user_wishlist_items. Several can exist for the same work - see
// the wishlist spec's "A work can have multiple wishlist entries".
export interface WishlistItem {
  id: string
  user_id: string
  work_id: string
  note: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

// A profile Wishlist tab row: the entry plus the work it's for. `kind`
// decides which detail page the title links to (workPath).
export interface WishlistEntry {
  id: string
  note: string | null
  tags: string[]
  createdAt: string
  work: {
    id: string
    kind: WorkKind
    title: string
    slug: string
    coverId: number | null
  }
}

export interface WishlistItemInput {
  note: string | null
  tags: string[]
}

const WISHLIST_ITEM_COLUMNS = 'id, user_id, work_id, note, tags, created_at, updated_at'

// Blank notes are stored as null, so "has a note" is just `note !== null`.
function toRow(input: WishlistItemInput) {
  const note = input.note?.trim() || null
  return { note, tags: normalizeWishlistTags(input.tags) }
}

function sortNewestFirst(items: WishlistItem[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function useWishlist() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // The *signed-in user's* own entries, keyed by work - what
  // BookReadingActions reads for its wishlist control. Same contract as
  // useBooks().userBooksByWorkId: only populated once something calls
  // fetchOwnWishlist(), so a page rendering book actions must pre-fetch it
  // (nuxt-conventions "BookReadingActions ... need their page to pre-fetch
  // status").
  const wishlistItemsByWorkId = useState<Record<string, WishlistItem[]>>('wishlistItemsByWorkId', () => ({}))

  const setWorkItems = (workId: string, items: WishlistItem[]) => {
    const rest = Object.fromEntries(Object.entries(wishlistItemsByWorkId.value).filter(([id]) => id !== workId))
    wishlistItemsByWorkId.value = items.length ? { ...rest, [workId]: sortNewestFirst(items) } : rest
  }

  const fetchOwnWishlist = async () => {
    if (!user.value) {
      wishlistItemsByWorkId.value = {}
      return []
    }

    const { data, error } = await supabase
      .from('user_wishlist_items')
      .select(WISHLIST_ITEM_COLUMNS)
      .eq('user_id', user.value.sub)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = data as WishlistItem[]
    const byWorkId: Record<string, WishlistItem[]> = {}
    for (const row of rows) (byWorkId[row.work_id] ??= []).push(row)
    wishlistItemsByWorkId.value = byWorkId

    return rows
  }

  // Any profile's wishlist - RLS decides whether the rows are visible (owner,
  // or public profile), so there's no privacy check here. Inactive works are
  // dropped, matching the Read List.
  const fetchWishlist = async (userId: string): Promise<WishlistEntry[]> => {
    interface Row {
      id: string
      note: string | null
      tags: string[]
      created_at: string
      works: { id: string, kind: WorkKind, title: string, slug: string, cover_id: number | null, active: boolean } | null
    }

    const { data, error } = await supabase
      .from('user_wishlist_items')
      .select('id, note, tags, created_at, works ( id, kind, title, slug, cover_id, active )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as unknown as Row[])
      .filter((row): row is Row & { works: NonNullable<Row['works']> } => row.works !== null && row.works.active)
      .map(row => ({
        id: row.id,
        note: row.note,
        tags: row.tags,
        createdAt: row.created_at,
        work: {
          id: row.works.id,
          kind: row.works.kind,
          title: row.works.title,
          slug: row.works.slug,
          coverId: row.works.cover_id
        }
      }))
  }

  const addWishlistItem = async (workId: string, input: WishlistItemInput) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_wishlist_items')
      .insert({ user_id: user.value.sub, work_id: workId, ...toRow(input) })
      .select(WISHLIST_ITEM_COLUMNS)
      .single()

    if (error) throw error

    const row = data as WishlistItem
    setWorkItems(workId, [...(wishlistItemsByWorkId.value[workId] ?? []), row])
    return row
  }

  const updateWishlistItem = async (id: string, input: WishlistItemInput) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_wishlist_items')
      .update(toRow(input))
      .eq('id', id)
      .select(WISHLIST_ITEM_COLUMNS)
      .single()

    if (error) throw error

    const row = data as WishlistItem
    setWorkItems(row.work_id, (wishlistItemsByWorkId.value[row.work_id] ?? []).map(item => (item.id === id ? row : item)))
    return row
  }

  const removeWishlistItem = async (id: string, workId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { error } = await supabase
      .from('user_wishlist_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    setWorkItems(workId, (wishlistItemsByWorkId.value[workId] ?? []).filter(item => item.id !== id))
  }

  // Tag input suggestions: the presets plus every custom tag the signed-in
  // user has already used, so reusing "cemetery-dance" is easier than
  // retyping it. Only ever the user's own tags - never another user's.
  const ownTagSuggestions = computed(() => {
    const ownTags = Object.values(wishlistItemsByWorkId.value).flatMap(items => items.flatMap(item => item.tags))
    return [...new Set<string>([...WISHLIST_PRESET_TAGS, ...ownTags])]
  })

  return {
    wishlistItemsByWorkId,
    ownTagSuggestions,
    fetchOwnWishlist,
    fetchWishlist,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem
  }
}
