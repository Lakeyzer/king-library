<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [
  { label: 'Works', to: '/works' },
  { label: 'Short Stories', to: '/short-stories' },
  { label: 'Adaptations', to: '/adaptations' }
]

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { open: openAuthModal } = useAuthModal()

const accountMenuItems: DropdownMenuItem[] = [
  { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
  { label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => supabase.auth.signOut() }
]
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="font-bold text-highlighted focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
      >
        King Library
      </NuxtLink>
    </template>

    <UNavigationMenu :items="links" />

    <template #right>
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
