<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { SUGGESTION_STATUS_LABEL } from '~/composables/useSuggestions'
import type { NotificationEntry } from '~/composables/useNotifications'

const links: NavigationMenuItem[] = [
  { label: 'Works', to: '/works', icon: 'i-lucide-book' },
  { label: 'Short Works', to: '/short-works', icon: 'i-lucide-book-open' },
  { label: 'Adaptations', to: '/adaptations', icon: 'i-lucide-clapperboard' },
  {
    label: 'More',
    icon: 'i-lucide-ellipsis',
    children: [
      {
        label: 'Dark Tower',
        to: '/dark-tower',
        icon: 'i-lucide-rose',
        description: 'Everything Dark Tower'
      },
      {
        label: 'Works by Others',
        to: '/works-by-others',
        icon: 'i-lucide-feather',
        description: 'Related to King\'s work'
      }
    ]
  }
]

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
const { open: openAuthModal } = useAuthModal()
const { canInstall, promptInstall } = usePwaInstall()
const toast = useToast()

const { fetchUserBooks } = useBooks()
const { fetchUserAdaptations } = useAdaptations()
const { fetchUserEditions: fetchUserBookEditions } = useBookshelf()
const { fetchUserShortStoryReads } = useShortStories()
const { fetchUserRelatedWorks } = useRelatedWorks()
const { fetchUserEditions: fetchUserRelatedWorkEditions } = useRelatedWorkEditions()
const { unreadCount, fetchUnreadCount, subscribeToUnread } = useNotifications()

// Client-only and best-effort: a failed count just leaves the dot as it
// was. Runs on mount, on sign-in/out (the watch below), and on every
// navigation - the fallback for when the Realtime subscription below isn't
// connected. See the suggestion-notifications change's design.md "Unread
// state" and "Live unread updates".
function refreshUnreadCount() {
  fetchUnreadCount().catch(() => {})
}

onMounted(refreshUnreadCount)
watch(() => route.path, refreshUnreadCount)

// Live dot/count updates. Keyed on the user id rather than the whole user
// object, so a session token refresh doesn't tear down and reopen the
// socket - only signing in, out, or as someone else does.
let unsubscribeFromUnread: (() => void) | null = null

// Only fires for notifications created while the app is open - ones that
// were already waiting on load show just the dot and count.
function toastNewNotification(notification: NotificationEntry) {
  const description = notification.type === 'suggestion_status_changed' && notification.status
    ? `Your suggestion "${notification.suggestionTitle}" changed to ${SUGGESTION_STATUS_LABEL[notification.status]}.`
    : `An admin responded to your suggestion "${notification.suggestionTitle}".`

  toast.add({
    title: 'New notification',
    description,
    icon: 'i-lucide-bell',
    actions: [{
      label: 'View',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        navigateTo('/notifications')
      }
    }]
  })
}

function resubscribeToUnread() {
  unsubscribeFromUnread?.()
  unsubscribeFromUnread = subscribeToUnread({ onNew: toastNewNotification })
}

onMounted(resubscribeToUnread)
watch(() => user.value?.sub, resubscribeToUnread)
onBeforeUnmount(() => unsubscribeFromUnread?.())

// Every per-user reactive store (userBooksByWorkId, userAdaptationsByAdaptationId,
// readShortStoryIds, etc.) is only populated when a page explicitly calls its
// fetch function via useAsyncData on load - none of them react to the
// signed-in/signed-out transition on their own. Without this, signing in or
// out while already on a page leaves every already-rendered
// BookReadingActions/AdaptationWatchActions/etc. showing stale status from
// the previous session until a full page reload. AppHeader is mounted on
// every page (both layouts), so this is the one place that can catch the
// transition regardless of which page it happens on - each fetch function
// already resets its store to {} when signed out (see e.g.
// useBooks().fetchUserBooks), so calling them all here is cheap and correct
// either direction.
watch(user, () => {
  fetchUserBooks()
  fetchUserAdaptations()
  fetchUserBookEditions()
  fetchUserShortStoryReads()
  fetchUserRelatedWorks()
  fetchUserRelatedWorkEditions()
  refreshUnreadCount()
})

const isSearchOpen = ref(false)
const colorMode = useColorMode()
const isDarkMode = computed(() => colorMode.value === 'dark')

// Hidden for now, independent of PWA installability itself (already verified
// working) - flip back to true to bring the header control back.
const SHOW_INSTALL_BUTTON = false

// Route middleware only re-runs on navigation, so signing out while already
// sitting on a page that requires sign-in (e.g. /profile) would otherwise
// leave it displayed - `user` going null doesn't trigger a re-check on its
// own. Navigate away explicitly whenever that's the case.
async function signOut() {
  toast.add({ title: 'Long days and pleasant nights', icon: 'i-lucide-hand-heart' })
  await supabase.auth.signOut()

  if (isAuthGatedRoute(route.path)) {
    await navigateTo('/')
  }
}

// computed so the Notifications entry's unread badge stays current.
const accountMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    // exact: true - /profile is an empty-path index child of the profile
    // layout route, and without it Vue Router's active-link fallback marks
    // this "active" on /profile/read-list and /profile/watch-list too (see
    // ProfileTabs.vue for the full explanation).
    { label: 'Profile', icon: 'i-lucide-user', to: '/profile', exact: true },
    { label: 'Read List', icon: 'i-lucide-book-open-check', to: '/profile/read-list' },
    { label: 'Watch List', icon: 'i-lucide-clapperboard', to: '/profile/watch-list' },
    { label: 'Following', icon: 'i-lucide-users', to: '/following' }
  ],
  [
    { label: 'Notifications', icon: 'i-lucide-bell', to: '/notifications', slot: 'notifications' as const },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
  ],
  [
    { label: 'Sign out', icon: 'i-lucide-log-out', onSelect: signOut }
  ]
])
</script>

<template>
  <UHeader mode="slideover">
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-bold text-highlighted focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
      >
        <img
          src="/pwa-icon-source.svg"
          alt=""
          class="size-8"
        >
        King Library
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="links"
      content-orientation="vertical"
    />

    <template #right>
      <UButton
        v-if="SHOW_INSTALL_BUTTON && canInstall"
        label="Install App"
        color="neutral"
        variant="ghost"
        icon="i-lucide-download"
        @click="promptInstall"
      />

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-search"
        aria-label="Search"
        @click="isSearchOpen = true"
      />

      <UTooltip
        text="That spells dark mode"
        :disabled="!isDarkMode"
      >
        <UColorModeButton />
      </UTooltip>

      <UDropdownMenu
        v-if="user"
        :items="accountMenuItems"
      >
        <!-- The chip sits inside the button (not around it) so the button
             itself stays the dropdown trigger that gets its ARIA state. -->
        <UButton
          color="neutral"
          variant="ghost"
          :aria-label="unreadCount > 0 ? `Account menu, ${unreadCount} unread notifications` : 'Account menu'"
        >
          <template #leading>
            <UChip
              :show="unreadCount > 0"
              inset
            >
              <UIcon
                name="i-lucide-user"
                class="size-5"
              />
            </UChip>
          </template>
        </UButton>

        <template #notifications-trailing>
          <UBadge
            v-if="unreadCount > 0"
            :label="unreadCount"
            color="primary"
            variant="solid"
            size="sm"
          />
        </template>
      </UDropdownMenu>
      <UButton
        v-else
        label="Sign in"
        color="neutral"
        variant="subtle"
        @click="openAuthModal"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="links"
        orientation="vertical"
      />
    </template>
  </UHeader>

  <CoreGlobalSearch v-model:open="isSearchOpen" />
</template>
