import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Follow a user, then email them about it. The in-app notification itself
// is created by the notify_on_follow() DB trigger, in the same transaction
// as the insert - this route only adds the email on top. See the
// add-followers-and-settings-pages change's design.md "Follow moves to
// POST /api/follows".
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const body = await readBody<{ followedId?: unknown }>(event)
  const followedId = body?.followedId

  if (typeof followedId !== 'string' || !UUID_PATTERN.test(followedId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid followedId' })
  }

  // User-scoped client, not the service role, so the insert policy
  // (follower_id = auth.uid()) and the no-self-follow check still apply.
  const supabase = await serverSupabaseClient(event)
  const { error: insertError } = await supabase
    .from('user_follows')
    .insert({ follower_id: user.sub, followed_id: followedId })

  // 23505: already following - a double-click is harmless, and the trigger
  // didn't run, so there's nothing to email either.
  if (insertError?.code === '23505') {
    return { success: true, emailSent: false }
  }

  // 23514: user_follows_no_self_follow.
  if (insertError?.code === '23514') {
    throw createError({ statusCode: 400, statusMessage: 'You cannot follow yourself' })
  }

  // 23503: the followed user doesn't exist.
  if (insertError?.code === '23503') {
    throw createError({ statusCode: 400, statusMessage: 'User not found' })
  }

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  let emailSent = false

  // Everything below is best-effort: an email failure is logged, never
  // surfaced as a failed follow - the follow and the in-app notification
  // have already been committed.
  try {
    // Service role (a narrow, documented exception - see supabase-conventions):
    // the recipient is never the caller, and their notifications,
    // email_preferences and auth.users row are unreadable to the caller's own
    // session. The recipient is the user the caller just followed, and the
    // row must be one the trigger created for this exact pair.
    const supabaseAdmin = serverSupabaseServiceRole(event)

    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('type', 'new_follower')
      .eq('user_id', followedId)
      .eq('actor_id', user.sub)
      .is('email_sent_at', null)
      .gt('created_at', new Date(Date.now() - 60_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (notificationError) throw notificationError

    // No row: the trigger de-duplicated this follow (a repeat within 24
    // hours), so there's nothing to email.
    if (notification) {
      const preferences = await getEmailPreferences(event, followedId)

      if (preferences.new_followers) {
        const { data: recipient, error: recipientError } = await supabaseAdmin.auth.admin.getUserById(followedId)

        if (recipientError) throw recipientError

        const { data: follower, error: followerError } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('id', user.sub)
          .single()

        if (followerError) throw followerError

        const email = recipient.user?.email

        if (email && follower.username) {
          const sent = await sendEmail(event, buildNewFollowerEmail({
            to: email,
            followerUsername: follower.username,
            origin: getRequestURL(event).origin
          }))

          // Marked even when the email was only logged (no Resend key
          // locally) - the row has been handled either way.
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
    console.error('[follows] Failed to send new follower email:', error)
  }

  return { success: true, emailSent }
})
