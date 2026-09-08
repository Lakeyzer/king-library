<script setup lang="ts">
import type { OwnedUnreadRecommendation } from "~/composables/useBooks";

interface Props {
  recommendation: OwnedUnreadRecommendation | null;
}

defineProps<Props>();
</script>

<template>
  <div v-if="recommendation" class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-library" class="size-4" />
      From Your Shelf
    </h2>

    <WorkTile
      :work="{
        id: recommendation.id,
        title: recommendation.title,
        slug: recommendation.slug,
        coverId: recommendation.coverId,
        publishDate: recommendation.publishDate,
      }"
      meta="On your shelf, not read yet"
    />
  </div>
</template>
