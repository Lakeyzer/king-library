<script setup lang="ts">
import type { BookRecommendation } from "~/composables/useBooks";

interface Props {
  recommendation: BookRecommendation | null;
}

defineProps<Props>();
</script>

<template>
  <div v-if="recommendation" class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-book-open" class="size-4" />
      Read This Next
    </h2>

    <WorkTile
      :work="{
        id: recommendation.id,
        title: recommendation.title,
        slug: recommendation.slug,
        coverId: recommendation.coverId,
        publishDate: recommendation.publishDate,
      }"
      :meta="`Because you watched ${recommendation.becauseTitle}`"
    />
  </div>
</template>
