<script setup lang="ts">
import type { GiftIdeaRecommendation } from '~/composables/useBooks'

interface Props {
  recommendation: GiftIdeaRecommendation | null
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="recommendation"
    class="flex flex-col gap-3 rounded-lg bg-elevated p-4"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="i-lucide-gift"
        class="size-4"
      />
      Gift Idea
    </h2>

    <WorkTile
      :work="{
        id: recommendation.id,
        title: recommendation.title,
        slug: recommendation.slug,
        coverId: recommendation.coverId,
        publishDate: recommendation.publishDate
      }"
      meta="It's on their read list, but not their shelf"
      :show-actions="false"
    />
  </div>
</template>
