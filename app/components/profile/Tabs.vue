<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

interface Props {
  /** "/profile" for the signed-in user's own tabs, "/profile/[username]" for a viewed profile's. */
  basePath: string
}

const props = defineProps<Props>()

// UTabs is local-state (v-model) only - it has no `to`/link concept, so it
// can't drive real routes. UNavigationMenu is what AppHeader already uses
// for route-linked navigation with active-state highlighting, which is
// exactly what these three tab routes need.
//
// `exact: true` on Reader Checklist specifically: it links to the profile
// route's empty-path index child (app/pages/profile/index.vue), and Vue
// Router's non-exact `isActive` deliberately falls back to matching the
// *parent* record when a link's target is such an index child - meaning
// without `exact`, this link reads as active on Read List/Watch List too,
// since they share the same `/profile` parent record. `exact` switches to
// `isExactActive`, which requires this to be the most specific matched
// record, i.e. only true on the index route itself.
const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Reader Checklist', icon: 'i-lucide-scroll-text', to: props.basePath, exact: true },
  { label: 'Read List', icon: 'i-lucide-book-open-check', to: `${props.basePath}/read-list` },
  { label: 'Watch List', icon: 'i-lucide-clapperboard', to: `${props.basePath}/watch-list` }
])
</script>

<template>
  <UNavigationMenu
    :items="items"
    highlight
    class="border-b border-default"
  />
</template>
