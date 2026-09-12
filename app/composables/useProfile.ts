export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  tagline: string | null
  is_public: boolean
  created_at: string
}

// Shared between each of the six profile-route leaf pages (own/by-username
// x Reader Checklist/Read List/Watch List) and the tab-content component
// each one renders, via Vue's provide/inject rather than a second
// independent fetch per tab. Deliberately NOT implemented as a Nuxt nested
// route (a profile.vue/[username].vue file wrapping a <NuxtPage /> for its
// children) - that was tried first and caused profile.vue to also parent
// profile/[username].vue, since [username].vue lives inside the same
// profile/ directory profile.vue owns as a nested-routes parent, so both
// pages' headers rendered stacked on top of each other. Six independent
// leaf pages, each calling provideViewedProfile() itself, avoids that
// class of bug entirely - see nuxt-conventions.
export interface ViewedProfileContext {
  profile: Profile
  isOwner: ComputedRef<boolean>
  isPrivate: ComputedRef<boolean>
}

export const viewedProfileKey: InjectionKey<ViewedProfileContext> = Symbol('viewed-profile')

export function useViewedProfile(): ViewedProfileContext {
  const context = inject(viewedProfileKey)
  if (!context) throw new Error('useViewedProfile() must be called from a tab-content component rendered inside <ProfileRouteChrome> (see the profile/* pages)')
  return context
}

// Called directly from a profile leaf page's own setup, synchronously,
// with whatever Profile that page has already resolved - the signed-in
// user's own (own-shortcut routes, already loaded by the onboarding
// middleware, no fetch needed) or one fetched by username (by-username
// routes: fetch it via useProfile().fetchProfileByUsername() and 404 in
// the page itself first, same as before this composable existed).
//
// Deliberately NOT an async function that does its own
// `await useAsyncData(...)` before calling provide() internally - that
// was tried first and broke provide() for the by-username routes. A
// `<script setup>` top-level await is specially compiled
// (`withAsyncContext`) to restore Vue's current-component-instance context
// after it resolves, but that compiler transform only wraps awaits written
// directly in the page's own script - it can't reach inside a separate
// async composable function the page merely calls. So `provide()` running
// after that composable's *own* internal await resumed (a plain JS
// microtask continuation, no instance-context restoration) had no
// reliable current instance to attach to, and every inject() downstream
// silently got nothing. Keeping this function synchronous (call it only
// after your own page-level await has already resolved) avoids that
// failure mode entirely - see nuxt-conventions.
export function provideViewedProfile(profile: Profile): ViewedProfileContext {
  const currentUser = useSupabaseUser()

  const context: ViewedProfileContext = {
    profile,
    isOwner: computed(() => currentUser.value?.sub === profile.id),
    isPrivate: computed(() => !profile.is_public && currentUser.value?.sub !== profile.id)
  }

  provide(viewedProfileKey, context)
  return context
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
