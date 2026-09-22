<script setup lang="ts">
import type { KingWork } from '~/composables/useKingWorks'

interface Props {
  /** The eight core Dark Tower novels, already ordered by the caller using
   * the canonical series position (not publish date) - see design.md
   * "Order the core 8 by series position, not publish date". */
  works: KingWork[]
}

defineProps<Props>()
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    :items="works"
    arrows
    dots
    class="w-full px-0 sm:px-10"
    :ui="{
      arrows: 'hidden sm:block',
      prev: 'start-0 sm:start-0 top-1/2 -translate-y-1/2',
      next: 'end-0 sm:end-0 top-1/2 -translate-y-1/2',
      dots: 'static inset-auto mt-4'
    }"
  >
    <DarkTowerCarouselItem :work="item" />
  </UCarousel>
</template>
