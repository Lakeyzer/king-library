<script setup lang="ts">
import type { AdaptationHighlight } from "~/composables/useAdaptations";

interface Props {
  items: AdaptationHighlight[];
  emptyDescription: string;
}

defineProps<Props>();
</script>

<template>
  <UEmpty
    v-if="!items.length"
    icon="i-lucide-clapperboard"
    title="Nothing here"
    :description="emptyDescription"
  />
  <ul v-else class="flex flex-col divide-y divide-accented">
    <li v-for="adaptation in items" :key="adaptation.id">
      <NuxtLink
        :to="`/adaptations/${adaptation.slug}`"
        class="group flex items-center gap-3 py-2 hover:bg-elevated"
      >
        <ImageThumbnail
          :src="
            adaptation.tmdbPosterPath
              ? getTmdbPosterUrl(adaptation.tmdbPosterPath, 'w92')
              : null
          "
          :alt="`${adaptation.title} poster`"
          placeholder-icon="i-lucide-clapperboard"
          size="xs"
        />
        <span
          class="min-w-0 flex-1 truncate font-medium text-highlighted group-hover:text-primary"
        >
          <NumberMotif :text="adaptation.title" />
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
