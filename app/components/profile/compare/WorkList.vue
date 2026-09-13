<script setup lang="ts">
import type { WorkHighlight } from "~/composables/useBooks";

interface Props {
  items: WorkHighlight[];
  emptyDescription: string;
}

defineProps<Props>();
</script>

<template>
  <UEmpty
    v-if="!items.length"
    icon="i-lucide-book-open-check"
    title="Nothing here"
    :description="emptyDescription"
  />
  <ul v-else class="flex flex-col divide-y divide-accented">
    <li v-for="work in items" :key="work.id">
      <NuxtLink
        :to="`/works/${work.slug}`"
        class="group flex items-center gap-3 py-2 hover:bg-elevated"
      >
        <ImageThumbnail
          :src="work.coverId ? getOpenLibraryCoverUrl(work.coverId, 'S') : null"
          :alt="`${work.title} cover`"
          placeholder-icon="i-lucide-book-open-check"
          size="xs"
        />
        <span
          class="min-w-0 flex-1 truncate font-medium text-highlighted group-hover:text-primary"
        >
          <NumberMotif :text="work.title" />
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
