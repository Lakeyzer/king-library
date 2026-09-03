export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  is_public: boolean
  created_at: string
}

const PROFILE_COLUMNS = 'id, username, avatar_url, is_public, created_at'

export function useProfile() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState<Profile | null>('profile', () => null)

  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.value.sub)
      .single()

    if (error) throw error

    profile.value = data as Profile
    return profile.value
  }

  const updateUsername = async (username: string) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.value.sub)
      .select(PROFILE_COLUMNS)
      .single()

    if (error) throw error

    profile.value = data as Profile
    return profile.value
  }

  const updateVisibility = async (isPublic: boolean) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_public: isPublic })
      .eq('id', user.value.sub)
      .select(PROFILE_COLUMNS)
      .single()

    if (error) throw error

    profile.value = data as Profile
    return profile.value
  }

  return { profile, fetchProfile, updateUsername, updateVisibility }
}
