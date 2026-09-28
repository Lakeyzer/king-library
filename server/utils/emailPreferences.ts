import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export interface EmailPreferences {
  suggestion_updates: boolean
  new_followers: boolean
}

// Must match the column defaults on email_preferences. A user with no row
// has never changed a toggle, so every preference is at its default - see
// the suggestion-notifications change's design.md "Email preferences".
export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  suggestion_updates: true,
  new_followers: true
}

// Every email-sending path checks the recipient's preferences through this
// helper, so the missing-row-means-defaults rule lives in one place. Uses
// the service role because the caller (e.g. an admin changing a suggestion's
// status) is never the recipient, and email_preferences is owner-only.
export async function getEmailPreferences(event: H3Event, userId: string): Promise<EmailPreferences> {
  const supabaseAdmin = serverSupabaseServiceRole(event)

  const { data, error } = await supabaseAdmin
    .from('email_preferences')
    .select('suggestion_updates, new_followers')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return { ...DEFAULT_EMAIL_PREFERENCES, ...data }
}
