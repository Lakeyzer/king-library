<script setup lang="ts">
import type { AdaptationRecommendation } from "~/composables/useAdaptations";

interface Props {
  recommendation: AdaptationRecommendation | null;
}

defineProps<Props>();
</script>

<template>
  <div v-if="recommendation" class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-clapperboard" class="size-4" />
      Watch This Next
    </h2>

    <AdaptationTile
      :adaptation="{
        id: recommendation.id,
        title: recommendation.title,
        slug: recommendation.slug,
        tmdbPosterPath: recommendation.tmdbPosterPath,
      }"
      :meta="`Because you read ${recommendation.becauseTitle}`"
    />
  </div>
</template>
