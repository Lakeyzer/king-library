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

// Hidden for now, independent of PWA installability itself (already verified
// working) - flip back to true to bring the header control back.
const SHOW_INSTALL_BUTTON = false

const accountMenuItems: DropdownMenuItem[] = [
  { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
  { label: 'Following', icon: 'i-lucide-users', to: '/following' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
  { label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => supabase.auth.signOut() }
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

      <UColorModeButton />

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
</template>
