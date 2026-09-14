<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [
  { label: 'Works', to: '/works' },
  { label: 'Short Works', to: '/short-works' },
  { label: 'Adaptations', to: '/adaptations' }
]

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { open: openAuthModal } = useAuthModal()
const { canInstall, promptInstall } = usePwaInstall()
const toast = useToast()

const isSearchOpen = ref(false)
const colorMode = useColorMode()
const isDarkMode = computed(() => colorMode.value === 'dark')

// Hidden for now, independent of PWA installability itself (already verified
// working) - flip back to true to bring the header control back.
const SHOW_INSTALL_BUTTON = false

function signOut() {
  toast.add({ title: 'Long days and pleasant nights', icon: 'i-lucide-hand-heart' })
  supabase.auth.signOut()
}

const accountMenuItems: DropdownMenuItem[][] = [
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
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' }
  ],
  [
    { label: 'Sign out', icon: 'i-lucide-log-out', onSelect: signOut }
  ]
]
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-bold text-highlighted focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
      >
        <img src="/pwa-icon-source.svg" alt="" class="size-8">
        King Library
      </NuxtLink>
    </template>

    <UNavigationMenu :items="links" />

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

      <UTooltip text="That spells dark mode" :disabled="!isDarkMode">
        <UColorModeButton />
      </UTooltip>

      <UDropdownMenu
        v-if="user"
        :items="accountMenuItems"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-user"
          aria-label="Account menu"
        />
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
