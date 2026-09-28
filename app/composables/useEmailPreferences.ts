import type { Database } from '~/types/database.types'

type EmailPreferencesRow = Database['public']['Tables']['email_preferences']['Row']

// Every boolean column on email_preferences is one email type, so adding a
// column (and regenerating types) widens this automatically.
export type EmailPreferenceKey = {
  [K in keyof EmailPreferencesRow]: EmailPreferencesRow[K] extends boolean ? K : never
}[keyof EmailPreferencesRow]

export type EmailPreferences = Record<EmailPreferenceKey, boolean>

// Must match the column defaults on email_preferences - a user with no row
// has never changed a toggle, so every preference is at its default. Mirrors
// DEFAULT_EMAIL_PREFERENCES in server/utils/emailPreferences.ts.
const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  suggestion_updates: true,
  new_followers: true
}

const EMAIL_PREFERENCE_KEYS = Object.keys(DEFAULT_EMAIL_PREFERENCES) as EmailPreferenceKey[]

// Keeps only the email-type columns from a `select('*')` row, so user_id
// and updated_at never end up in the preferences object.
function pickPreferences(row: Partial<EmailPreferencesRow> | null): Partial<EmailPreferences> {
  if (!row) return {}

  return Object.fromEntries(
    EMAIL_PREFERENCE_KEYS
      .filter(key => typeof row[key] === 'boolean')
      .map(key => [key, row[key]])
  )
}

// Drives the "Email notifications" section on /settings/notifications - one toggle per
// entry. Adding an email type means one column, one default above, and one
// entry here.
export const EMAIL_PREFERENCE_OPTIONS: { key: EmailPreferenceKey, label: string, description: string }[] = [
  {
    key: 'suggestion_updates',
    label: 'Suggestion updates',
    description: 'Get an email when the status of a suggestion you submitted changes.'
  },
  {
    key: 'new_followers',
    label: 'New followers',
    description: 'Get an email when someone starts following you.'
  }
]

export function useEmailPreferences() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const preferences = useState<EmailPreferences>('email-preferences', () => ({ ...DEFAULT_EMAIL_PREFERENCES }))

  // Owner-only RLS means this only ever returns the signed-in user's row. A
  // missing row is the normal state for anyone who hasn't changed a toggle
  // yet, and reads as all defaults.
  const fetchPreferences = async () => {
    if (!user.value) {
      preferences.value = { ...DEFAULT_EMAIL_PREFERENCES }
      return preferences.value
    }

    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.value.sub)
      .maybeSingle()

    if (error) throw error

    preferences.value = { ...DEFAULT_EMAIL_PREFERENCES, ...pickPreferences(data) }
    return preferences.value
  }

  // Upsert on user_id, sending only the changed column: the first change
  // creates the row, and every other column keeps its default.
  const updatePreference = async (key: EmailPreferenceKey, enabled: boolean) => {
    if (!user.value) throw new Error('Not signed in')

    // A computed key widens to a string index signature, which the
    // generated insert type rejects - so type the changed column explicitly.
    const change: Partial<EmailPreferences> = { [key]: enabled }

    const { error } = await supabase
      .from('email_preferences')
      .upsert(
        { user_id: user.value.sub, ...change, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) throw error

    preferences.value = { ...preferences.value, [key]: enabled }
  }

  return {
    preferences,
    fetchPreferences,
    updatePreference
  }
}
