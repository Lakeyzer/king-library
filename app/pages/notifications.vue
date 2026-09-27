<script setup lang="ts">
import { SUGGESTION_STATUS_COLOR, SUGGESTION_STATUS_LABEL } from '~/composables/useSuggestions'
import type { NotificationEntry, NotificationType } from '~/composables/useNotifications'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Notifications',
  description: 'Updates about the suggestions you submitted to King Library.'
})

const PAGE_SIZE = 20

const TYPE_ICON: Record<NotificationType, string> = {
  suggestion_status_changed: 'i-lucide-circle-dot',
  suggestion_commented: 'i-lucide-message-square'
}

const { fetchNotifications, markAllRead } = useNotifications()
const toast = useToast()

const page = ref(1)

const { data } = await useAsyncData(
  'notifications',
  () => fetchNotifications({ page: page.value, pageSize: PAGE_SIZE }),
  { watch: [page] }
)

const notifications = computed(() => data.value?.notifications ?? [])
const total = computed(() => data.value?.total ?? 0)

// Ids that were unread when this visit started - kept highlighted as new
// for the rest of the visit even though they're marked read right away
// (see specs/notifications "Viewing the notification center marks
// notifications read").
const newIds = ref(new Set<string>())

function isNew(notification: NotificationEntry) {
  return notification.readAt === null || newIds.value.has(notification.id)
}

// Client-only, so the unread dot clears in the header without a reload.
onMounted(async () => {
  try {
    newIds.value = new Set(await markAllRead())
  } catch {
    toast.add({
      title: 'Could not mark notifications as read',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }
})
</script>

<template>
  <div class="py-8">
    <div class="flex items-center gap-2">
      <UIcon
        name="i-lucide-bell"
        class="text-primary size-5"
      />
      <h1 class="text-xl font-semibold">
        Notifications
      </h1>
    </div>
    <p class="text-muted text-sm mt-1 mb-6">
      Updates about the suggestions you submitted.
    </p>

    <UEmpty
      v-if="!notifications.length"
      icon="i-lucide-bell"
      title="No notifications yet"
      description="When an admin updates or responds to one of your suggestions, it will show up here."
    />

    <template v-else>
      <ul class="space-y-2">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="flex gap-3 rounded-lg border p-3"
          :class="isNew(notification) ? 'border-primary/40 bg-primary/5' : 'border-default bg-elevated'"
        >
          <UIcon
            :name="TYPE_ICON[notification.type]"
            class="mt-0.5 size-5 shrink-0"
            :class="isNew(notification) ? 'text-primary' : 'text-muted'"
          />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <template v-if="notification.type === 'suggestion_status_changed' && notification.status">
                <span>
                  Your suggestion
                  <span class="font-medium">"<NumberMotif :text="notification.suggestionTitle" />"</span>
                  changed to
                </span>
                <UBadge
                  :color="SUGGESTION_STATUS_COLOR[notification.status]"
                  variant="subtle"
                  size="sm"
                >
                  {{ SUGGESTION_STATUS_LABEL[notification.status] }}
                </UBadge>
              </template>
              <span v-else>
                An admin responded to your suggestion
                <span class="font-medium">"<NumberMotif :text="notification.suggestionTitle" />"</span>
              </span>

              <UBadge
                v-if="isNew(notification)"
                label="New"
                color="primary"
                variant="solid"
                size="sm"
              />
            </div>

            <p
              v-if="notification.type === 'suggestion_commented' && notification.adminComment"
              class="mt-2 border-l-2 border-primary/40 pl-3 text-sm text-muted whitespace-pre-wrap"
            >
              <NumberMotif :text="notification.adminComment" />
            </p>

            <p class="mt-1 text-xs text-dimmed">
              <NumberMotif :text="formatRelativeTime(notification.createdAt)" />
            </p>
          </div>
        </li>
      </ul>

      <div
        v-if="total > PAGE_SIZE"
        class="flex justify-center mt-6"
      >
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="PAGE_SIZE"
        />
      </div>
    </template>
  </div>
</template>
