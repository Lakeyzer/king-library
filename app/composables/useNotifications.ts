import type { SuggestionStatus } from '~/composables/useSuggestions'

export type NotificationType = 'suggestion_status_changed' | 'suggestion_commented'

export interface NotificationEntry {
  id: string
  type: NotificationType
  suggestionId: string
  suggestionTitle: string
  // Set for suggestion_status_changed - the status it changed to.
  status: SuggestionStatus | null
  // Set for suggestion_commented - the response text at that moment.
  adminComment: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  notifications: NotificationEntry[]
  total: number
}

const NOTIFICATION_COLUMNS = 'id, type, suggestion_id, suggestion_title, status, admin_comment, read_at, created_at'

interface NotificationRow {
  id: string
  type: NotificationType
  suggestion_id: string
  suggestion_title: string
  status: SuggestionStatus | null
  admin_comment: string | null
  read_at: string | null
  created_at: string
}

function toNotificationEntry(row: NotificationRow): NotificationEntry {
  return {
    id: row.id,
    type: row.type,
    suggestionId: row.suggestion_id,
    suggestionTitle: row.suggestion_title,
    status: row.status,
    adminComment: row.admin_comment,
    readAt: row.read_at,
    createdAt: row.created_at
  }
}

export function useNotifications() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Shared across the app so the header's unread dot and the notification
  // center stay in step - markAllRead() below zeroes it, which is what clears
  // the dot without a reload. Refreshed by AppHeader on sign-in/out and on
  // navigation; there's no realtime subscription (see design.md "Unread
  // state").
  const unreadCount = useState('notifications-unread-count', () => 0)
  // Bumped by markAllRead(). A count request that started before a
  // mark-read finished could otherwise land afterwards and bring back a
  // stale dot - e.g. AppHeader's on-navigation refresh racing the
  // notification center's own markAllRead() on arrival.
  const unreadGeneration = useState('notifications-unread-generation', () => 0)

  // Every query below relies on the owner-only RLS policies on
  // notifications, so no explicit user_id filter is needed to scope reads
  // to the signed-in user.
  const fetchUnreadCount = async () => {
    if (!user.value) {
      unreadCount.value = 0
      return
    }

    const generation = unreadGeneration.value

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)

    if (error) throw error

    if (generation === unreadGeneration.value) {
      unreadCount.value = count ?? 0
    }
  }

  // 1-indexed page, matching Nuxt UI's UPagination convention.
  const fetchNotifications = async (
    { page, pageSize }: { page: number, pageSize: number }
  ): Promise<NotificationPage> => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('notifications')
      .select(NOTIFICATION_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      notifications: (data as NotificationRow[]).map(toNotificationEntry),
      total: count ?? 0
    }
  }

  // read_at is the only column the owner can update (column-level grant),
  // so this can never touch anything else on a notification. Returns the
  // ids it marked, so the notification center can keep highlighting them as
  // new for the rest of the visit - including ones on later pages that
  // haven't been fetched yet.
  const markAllRead = async (): Promise<string[]> => {
    if (!user.value) return []

    unreadGeneration.value += 1

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .select('id')

    if (error) throw error

    unreadCount.value = 0
    return (data ?? []).map(row => row.id)
  }

  // Live updates for the header's unread dot and count via Supabase Realtime
  // (Postgres Changes). Any INSERT (a new notification) or UPDATE (marked
  // read, possibly in another tab) on this user's rows just re-runs
  // fetchUnreadCount() - one tiny query that's always exactly right, rather
  // than patching the count from the payload. Realtime checks the owner-only
  // select policy before sending each change; the user_id filter only saves
  // it evaluating other users' rows. Returns an unsubscribe function. See
  // design.md "Live unread updates".
  //
  // onNew receives each newly created notification. Realtime only delivers
  // changes made after the channel subscribed, so notifications already
  // waiting when the app loaded never reach it - they only show in the
  // unread count.
  const subscribeToUnread = (
    { onNew }: { onNew?: (notification: NotificationEntry) => void } = {}
  ): (() => void) => {
    const userId = user.value?.sub
    if (!userId) return () => {}

    const refresh = () => {
      fetchUnreadCount().catch(() => {})
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          refresh()
          onNew?.(toNotificationEntry(payload.new as NotificationRow))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        refresh
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    subscribeToUnread,
    fetchNotifications,
    markAllRead
  }
}
