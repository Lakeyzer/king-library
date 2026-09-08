<script setup lang="ts">
import type { HomepageStats } from "~/composables/useHomepage";

interface Props {
  stats: HomepageStats;
}

const props = defineProps<Props>();

const tiles = computed(() => [
  { label: "King Fans", icon: "i-lucide-users", value: props.stats.fanCount },
  { label: "Books Read", icon: "i-lucide-book-open", value: props.stats.booksReadCount },
  { label: "Books Owned", icon: "i-lucide-library", value: props.stats.booksOwnedCount },
  { label: "Adaptations Watched", icon: "i-lucide-film", value: props.stats.adaptationsWatchedCount },
]);
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated pt-3">
    <h2 class="flex items-center gap-2 px-4 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-bar-chart-3" class="size-4" />
      By the Numbers
    </h2>

    <ul class="flex flex-col divide-y divide-accented">
      <li
        v-for="tile in tiles"
        :key="tile.label"
        class="flex items-center gap-3 px-4 py-1.5"
      >
        <UIcon :name="tile.icon" class="size-5 shrink-0 text-primary" />
        <span class="flex-1 truncate text-sm text-muted">{{ tile.label }}</span>
        <span class="text-lg font-bold tabular-nums text-highlighted">{{ tile.value.toLocaleString() }}</span>
      </li>
    </ul>
  </div>
</template>
