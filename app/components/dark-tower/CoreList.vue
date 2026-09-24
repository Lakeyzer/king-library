<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

interface Props {
  /** The eight core Dark Tower novels, already ordered by the caller using
   * the canonical series position (not publish date) - see design.md
   * "Order the core 8 by series position, not publish date". */
  works: KingWork[];
}

defineProps<Props>();
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    :items="works"
    arrows
    dots
    loop
    class="w-full"
    :ui="{
      controls: 'mt-4 flex items-center justify-center gap-4',
      arrows: 'contents',
      prev: 'static order-1 rounded-full translate-y-0.2',
      next: 'static order-3 rounded-full translate-y-0.2',
      dots: 'static inset-auto order-2',
    }"
  >
    <DarkTowerCarouselItem :work="item" />
  </UCarousel>
</template>
