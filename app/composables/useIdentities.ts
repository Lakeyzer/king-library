import type { UserIdentity } from '@supabase/supabase-js'

export type LinkableProvider = 'google' | 'discord'

export function useIdentities() {
  const supabase = useSupabaseClient()
  const identities = useState<UserIdentity[]>('identities', () => [])

  const fetchIdentities = async () => {
    const { data, error } = await supabase.auth.getUserIdentities()

    if (error) throw error

    identities.value = data.identities
    return identities.value
  }

  const linkProvider = async (provider: LinkableProvider, redirectTo: string) => {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo }
    })

    if (error) throw error
  }

  const unlinkProvider = async (identity: UserIdentity) => {
    const { error } = await supabase.auth.unlinkIdentity(identity)

    if (error) throw error

    await fetchIdentities()
  }

  return { identities, fetchIdentities, linkProvider, unlinkProvider }
}
