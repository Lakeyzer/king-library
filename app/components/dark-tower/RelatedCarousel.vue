<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

interface Props {
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
      item: 'basis-28 sm:basis-32 md:basis-36 lg:basis-40',
      controls: 'mt-4 flex items-center justify-center gap-4',
      arrows: 'contents',
      prev: 'static order-1 rounded-full translate-y-0.2',
      next: 'static order-3 rounded-full translate-y-0.2',
      dots: 'static inset-auto order-2',
    }"
  >
    <DarkTowerRelatedCard :work="item" />
  </UCarousel>
</template>
