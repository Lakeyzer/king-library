<script setup lang="ts">
import type { WorkHighlight } from "~/composables/useBooks";

interface Props {
  works: WorkHighlight[];
}

defineProps<Props>();

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatFullDate(publishDate: string) {
  return dateFormatter.format(new Date(publishDate));
}

function ageInYears(publishDate: string) {
  return new Date().getFullYear() - Number(publishDate.slice(0, 4));
}
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated pt-3">
    <h2 class="flex items-center gap-2 px-4 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-cake" class="size-4" />
      Book Birthday
    </h2>

    <UEmpty v-if="!works.length" class="px-4" description="No King work was published on this day." />

    <ul v-else class="flex flex-col divide-y divide-accented">
      <li v-for="work in works" :key="work.id" class="flex items-center gap-3 px-4 py-1.5 hover:bg-accented/50">
        <NuxtLink :to="`/works/${work.slug}`" class="group flex min-w-0 flex-1 items-center gap-2">
          <ImageThumbnail
            :src="work.coverId ? getOpenLibraryCoverUrl(work.coverId, 'S') : null"
            :alt="`${work.title} cover`"
            placeholder-icon="i-lucide-book"
            size="xs"
          />
          <div class="flex min-w-0 flex-col">
            <p class="truncate text-sm font-medium text-highlighted group-hover:text-primary">
              {{ work.title }}
            </p>
            <p class="text-xs text-muted">{{ formatFullDate(work.publishDate) }}</p>
          </div>
        </NuxtLink>

        <div class="flex shrink-0 flex-col items-end">
          <span class="text-2xl font-bold tabular-nums text-highlighted">{{ ageInYears(work.publishDate) }}</span>
          <span class="text-xs text-muted">years old</span>
        </div>
      </li>
    </ul>
  </div>
</template>
