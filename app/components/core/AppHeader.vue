<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [
  { label: 'Works', to: '/works' },
  { label: 'Short Stories', to: '/short-stories' },
  { label: 'Adaptations', to: '/adaptations' }
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
    </template>

    <template #body>
      <UNavigationMenu
        :items="links"
        orientation="vertical"
      />
    </template>
  </UHeader>
</template>
