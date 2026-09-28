import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const VALID_STATUSES = ['new', 'rejected', 'confirmed', 'applied']

// Admin-only suggestion status change, then a status-change email to the
// suggestion's author. The in-app notification itself is created by the
// notify_on_suggestion_update() DB trigger, in the same transaction as the
// update - this route only adds the email on top. See the
// suggestion-notifications change's design.md "Status change moves to
// PATCH /api/suggestions/[id]/status".
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  // Early exit for a clear error only - the "suggestions status updatable by
  // admin" RLS policy is what actually enforces this on the update below.
  if (user.app_metadata?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Not an admin' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status?: unknown }>(event)
  const status = body?.status

  if (!id || typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  // User-scoped client, not the service role, so RLS applies to the update.
  const supabase = await serverSupabaseClient(event)
  const { data: updated, error: updateError } = await supabase
    .from('suggestions')
    .update({ status })
    .eq('id', id)
    .select('id')

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  if (!updated?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Suggestion not found' })
  }

  let emailSent = false

  // Everything below is best-effort: an email failure is logged, never
  // surfaced as a failed status change - the update and the in-app
  // notification have already been committed.
  try {
    // Service role (a narrow, documented exception - see supabase-conventions):
    // the recipient is never the caller, and both notifications and
    // auth.users are unreadable to the admin's own session. The recipient id
    // always comes from the trigger-created notification row, never from the
    // request.
    const supabaseAdmin = serverSupabaseServiceRole(event)

    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, suggestion_title, status')
      .eq('suggestion_id', id)
      .eq('type', 'suggestion_status_changed')
      .is('email_sent_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (notificationError) throw notificationError

    // No row: the status didn't actually change, so there's nothing to email.
    if (notification?.status && notification.suggestion_title) {
      const preferences = await getEmailPreferences(event, notification.user_id)

      if (preferences.suggestion_updates) {
        const { data: recipient, error: recipientError } = await supabaseAdmin.auth.admin.getUserById(notification.user_id)

        if (recipientError) throw recipientError

        const email = recipient.user?.email

        if (email) {
          const sent = await sendEmail(event, buildSuggestionStatusEmail({
            to: email,
            suggestionTitle: notification.suggestion_title,
            status: notification.status,
            origin: getRequestURL(event).origin
          }))

          // Marked even when the email was only logged (no Resend key
          // locally) - the row has been handled either way, and a later
          // status change must not pick it up again.
          const { error: markError } = await supabaseAdmin
            .from('notifications')
            .update({ email_sent_at: new Date().toISOString() })
            .eq('id', notification.id)

          if (markError) throw markError

          emailSent = sent
        }
      }
    }
  } catch (error) {
    console.error('[suggestions/status] Failed to send status email:', error)
  }

  return { success: true, emailSent }
})
