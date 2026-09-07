<script setup lang="ts">
import type { ShortStoryCollectionSummary } from "~/composables/useShortStories";

interface Props {
  collections: ShortStoryCollectionSummary[];
  coveragePercent: number;
}

defineProps<Props>();

function storyCountLabel(count: number) {
  return `${count} ${count === 1 ? "story" : "stories"}`;
}

const toWorkHighlight = (collection: ShortStoryCollectionSummary) => ({
  id: collection.id,
  title: collection.title,
  slug: collection.slug,
  coverId: collection.coverId,
  publishDate: collection.publishDate,
});
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated pt-3">
    <h2 class="flex items-center gap-2 px-4 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-library-big" class="size-4" />
      Collections
    </h2>

    <p v-if="coveragePercent < 100" class="px-4 text-xs text-muted">
      {{ coveragePercent }}% of short works appear in a collection.
    </p>

    <UEmpty v-if="!collections.length" class="px-4" description="No collections yet." />

    <ul v-else class="flex flex-col divide-y divide-accented">
      <li v-for="collection in collections" :key="collection.id">
        <WorkTile
          :work="toWorkHighlight(collection)"
          :meta="storyCountLabel(collection.storyCount)"
          class="px-4 py-1.5 hover:bg-accented/50"
        />
      </li>
    </ul>
  </div>
</template>
