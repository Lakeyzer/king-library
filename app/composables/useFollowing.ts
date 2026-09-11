import type { CurrentlyReadingWork } from './useBooks'
import type { Profile } from './useProfile'

export interface FollowingCurrentlyReading {
  profile: Profile
  works: CurrentlyReadingWork[]
}

const PROFILE_COLUMNS = 'id, username, avatar_url, tagline, is_public, created_at'

export function useFollowing() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const fetchFollowing = async (userId?: string): Promise<Profile[]> => {
    const followerId = userId ?? user.value?.sub
    if (!followerId) throw new Error('Not signed in')

    const { data: follows, error: followsError } = await supabase
      .from('user_follows')
      .select('followed_id')
      .eq('follower_id', followerId)

    if (followsError) throw followsError

    const followedIds = follows.map(row => row.followed_id)
    if (followedIds.length === 0) return []

    // `user_follows.followed_id` references `auth.users`, not `profiles`, so
    // there's no direct FK PostgREST can embed through - fetch profiles as a
    // second query instead (same two-query pattern as fetchFollowingCurrentlyReading).
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .in('id', followedIds)

    if (profilesError) throw profilesError

    return profiles as Profile[]
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

  const follow = async (profileId: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: user.value.sub, followed_id: profileId })

    if (error) throw error
  }

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
    const followedProfiles = await fetchFollowing()
    if (followedProfiles.length === 0) return []

    const followedIds = followedProfiles.map(profile => profile.id)

    const { data, error } = await supabase
      .from('user_books')
      .select('user_id, started_on, king_works ( id, title, slug, cover_id )')
      .in('user_id', followedIds)
      .eq('currently_reading', true)
      .order('started_on', { ascending: false, nullsFirst: false })

    if (error) throw error

    const rows = data as unknown as {
      user_id: string
      started_on: string | null
      king_works: { id: string, title: string, slug: string, cover_id: number | null } | null
    }[]

    const worksByUserId = new Map<string, CurrentlyReadingWork[]>()

    for (const row of rows) {
      if (!row.king_works) continue

      const work: CurrentlyReadingWork = {
        id: row.king_works.id,
        title: row.king_works.title,
        slug: row.king_works.slug,
        coverId: row.king_works.cover_id,
        startedOn: row.started_on
      }

      const existing = worksByUserId.get(row.user_id)
      if (existing) {
        existing.push(work)
      } else {
        worksByUserId.set(row.user_id, [work])
      }
    }

    return followedProfiles
      .filter(profile => worksByUserId.has(profile.id))
      .map(profile => ({ profile, works: worksByUserId.get(profile.id)! }))
  }

  return { fetchFollowing, isFollowing, follow, unfollow, fetchFollowingCurrentlyReading }
}
