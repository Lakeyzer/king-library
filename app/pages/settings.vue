<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// Parent route for /settings/*: renders the settings navigation once, and
// each settings page inside <NuxtPage />. Nothing else lives under
// pages/settings/, so this parent can't over-match a dynamic sibling (the
// problem nuxt-conventions describes for profile/).
definePageMeta({ layout: 'default' })

const NAVIGATION: NavigationMenuItem[] = [
  { label: 'Profile', icon: 'i-lucide-user', to: '/settings/profile' },
  { label: 'Account', icon: 'i-lucide-shield', to: '/settings/account' },
  { label: 'Notifications', icon: 'i-lucide-bell', to: '/settings/notifications' }
]
</script>

<template>
  <UPage>
    <template #left>
      <UPageAside>
        <h1 class="text-xl font-semibold mb-4 px-2.5">
          Settings
        </h1>
        <UNavigationMenu
          :items="NAVIGATION"
          orientation="vertical"
        />
      </UPageAside>
    </template>

    <div class="py-8 lg:py-16">
      <!-- UPageAside is hidden below lg, so small screens get the same
           navigation above the content instead. -->
      <div class="lg:hidden mb-6">
        <h1 class="text-xl font-semibold mb-2">
          Settings
        </h1>
        <UNavigationMenu
          :items="NAVIGATION"
          orientation="horizontal"
          class="-mx-2.5 overflow-x-auto"
        />
      </div>

      <div class="max-w-2xl">
        <NuxtPage />
      </div>
    </div>
  </UPage>
</template>
