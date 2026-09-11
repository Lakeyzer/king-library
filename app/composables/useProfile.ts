export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  tagline: string | null
  is_public: boolean
  created_at: string
}

const PROFILE_COLUMNS = 'id, username, avatar_url, tagline, is_public, created_at'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

  const fetchProfileByUsername = async (username: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('username_lower', username.toLowerCase())
      .maybeSingle()

    if (error) throw error

    return data as Profile | null
  }

  const checkUsernameAvailable = async (username: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username_lower', username.toLowerCase())
      .maybeSingle()

    if (error) throw error

    return data === null
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

  const updateTagline = async (tagline: string | null) => {
    if (!user.value) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ tagline })
      .eq('id', user.value.sub)
      .select(PROFILE_COLUMNS)
      .single()

    if (error) throw error

    profile.value = data as Profile
    return profile.value
  }

  const uploadAvatar = async (file: File) => {
    if (!user.value) throw new Error('Not signed in')

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      throw new Error('Unsupported image type. Please use JPEG, PNG, or WebP.')
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('Image is too large. Please use an image under 2MB.')
    }

    const path = `${user.value.sub}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.value.sub)
      .select(PROFILE_COLUMNS)
      .single()

    if (error) throw error

    profile.value = data as Profile
    return profile.value
  }

  return {
    profile,
    fetchProfile,
    fetchProfileByUsername,
    checkUsernameAvailable,
    updateUsername,
    updateVisibility,
    updateTagline,
    uploadAvatar
  }
}
