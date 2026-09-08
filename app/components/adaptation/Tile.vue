<script setup lang="ts">
import type { AdaptationHighlight } from "~/composables/useAdaptations";

interface Props {
  adaptation: AdaptationHighlight;
  meta?: string;
}

defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="`/adaptations/${adaptation.slug}`"
    class="group flex items-center gap-2"
  >
    <ImageThumbnail
      :src="adaptation.tmdbPosterPath ? getTmdbPosterUrl(adaptation.tmdbPosterPath, 'w92') : null"
      :alt="`${adaptation.title} poster`"
      placeholder-icon="i-lucide-film"
      size="xs"
    />

    <div class="flex min-w-0 flex-1 flex-col">
      <p class="truncate text-sm font-medium text-highlighted group-hover:text-primary">
        {{ adaptation.title }}
      </p>
      <p v-if="meta" class="text-xs text-muted">{{ meta }}</p>
    </div>
  </NuxtLink>
</template>
