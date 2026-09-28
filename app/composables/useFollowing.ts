import type { CurrentlyReadingWork } from './useBooks'
import type { Profile } from './useProfile'

export interface FollowingCurrentlyReading {
  profile: Profile
  works: CurrentlyReadingWork[]
}

export interface FollowEntry {
  profile: Profile
  followedAt: string
}

export interface FollowPage {
  entries: FollowEntry[]
  total: number
}

const PROFILE_COLUMNS = 'id, username, avatar_url, tagline, is_public, created_at'

export function useFollowing() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // `user_follows` references `auth.users`, not `profiles`, so there's no
  // direct FK PostgREST can embed through - fetch profiles as a second query
  // instead. Callers restore their own order from the returned map.
  const fetchProfilesById = async (ids: string[]): Promise<Map<string, Profile>> => {
    if (ids.length === 0) return new Map()

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .in('id', ids)

    if (error) throw error

    return new Map((data as Profile[]).map(profile => [profile.id, profile]))
  }

  // One page of either side of the signed-in user's follows, newest follow
  // first. 1-indexed page, matching Nuxt UI's UPagination convention (same
  // as useNotifications().fetchNotifications()). The "user_follows readable
  // by follower or followed" policy is what lets the followers side work at
  // all - nobody can read another user's followers.
  const fetchFollowPage = async (
    side: 'following' | 'followers',
    { page, pageSize }: { page: number, pageSize: number }
  ): Promise<FollowPage> => {
    const userId = user.value?.sub
    if (!userId) throw new Error('Not signed in')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const matchColumn = side === 'following' ? 'follower_id' : 'followed_id'

    const { data, error, count } = await supabase
      .from('user_follows')
      .select('follower_id, followed_id, created_at', { count: 'exact' })
      .eq(matchColumn, userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const rows = data.map(row => ({
      otherId: side === 'following' ? row.followed_id : row.follower_id,
      followedAt: row.created_at
    }))

    const profilesById = await fetchProfilesById(rows.map(row => row.otherId))

    return {
      entries: rows
        .filter(row => profilesById.has(row.otherId))
        .map(row => ({ profile: profilesById.get(row.otherId)!, followedAt: row.followedAt })),
      total: count ?? 0
    }
  }

  const fetchFollowing = (options: { page: number, pageSize: number }) => fetchFollowPage('following', options)

  const fetchFollowers = (options: { page: number, pageSize: number }) => fetchFollowPage('followers', options)

  // Every id the signed-in user follows, unpaginated. Used by the Currently
  // reading sidebar (which must not be limited to one page of the Following
  // tab) and for Follow back state on the Followers tab.
  const fetchFollowingIds = async (): Promise<Set<string>> => {
    const userId = user.value?.sub
    if (!userId) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('user_follows')
      .select('followed_id')
      .eq('follower_id', userId)

    if (error) throw error

    return new Set(data.map(row => row.followed_id))
  }

  const isFollowing = async (profileId: string): Promise<boolean> => {
    if (!user.value) return false

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.value.sub)
      .eq('followed_id', profileId)
      .maybeSingle()

    if (error) throw error

    return data !== null
  }

  // Goes through the server so the followed user can be emailed after the
  // follow is saved - see server/api/follows.post.ts.
  const follow = async (profileId: string) => {
    if (!user.value) throw new Error('Not signed in')

    await $fetch('/api/follows', {
      method: 'POST',
      body: { followedId: profileId }
    })
  }

  // Stays a direct delete - nothing is sent on unfollow.
  const unfollow = async (profileId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.value.sub)
      .eq('followed_id', profileId)

    if (error) throw error
  }

  const fetchFollowingCurrentlyReading = async (): Promise<FollowingCurrentlyReading[]> => {
    const followedIds = [...await fetchFollowingIds()]
    if (followedIds.length === 0) return []

    const { data, error } = await supabase
      .from('user_books')
      .select('user_id, started_on, works!user_books_work_id_fkey ( id, kind, title, slug, cover_id )')
      .in('user_id', followedIds)
      .eq('currently_reading', true)
      .order('started_on', { ascending: false, nullsFirst: false })

    if (error) throw error

    const rows = data as unknown as {
      user_id: string
      started_on: string | null
      works: { id: string, kind: 'king' | 'related', title: string, slug: string, cover_id: number | null } | null
    }[]

    const worksByUserId = new Map<string, CurrentlyReadingWork[]>()

    for (const row of rows) {
      // The Following sidebar stays King-only, per user-following spec.
      if (!row.works || row.works.kind !== 'king') continue

      const work: CurrentlyReadingWork = {
        id: row.works.id,
        kind: row.works.kind,
        title: row.works.title,
        slug: row.works.slug,
        coverId: row.works.cover_id,
        startedOn: row.started_on,
        // Not displayed in the Following feed (see app/pages/following.vue) -
        // fetching the column would be pointless without a rendering need.
        format: null
      }

      const existing = worksByUserId.get(row.user_id)
      if (existing) {
        existing.push(work)
      } else {
        worksByUserId.set(row.user_id, [work])
      }
    }

    // Only the users actually reading something need a profile.
    const readingIds = followedIds.filter(id => worksByUserId.has(id))
    const profilesById = await fetchProfilesById(readingIds)

    return readingIds
      .filter(id => profilesById.has(id))
      .map(id => ({ profile: profilesById.get(id)!, works: worksByUserId.get(id)! }))
  }

  return {
    fetchFollowing,
    fetchFollowers,
    fetchFollowingIds,
    isFollowing,
    follow,
    unfollow,
    fetchFollowingCurrentlyReading
  }
}
