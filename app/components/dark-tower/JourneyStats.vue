<script setup lang="ts">
import type { DarkTowerJourneyStats } from "~/composables/useBooks";

interface Props {
  stats: DarkTowerJourneyStats | null;
}

const props = defineProps<Props>();

const tiles = computed(() => [
  { label: "Reached the Tower", icon: "i-lucide-flag", value: props.stats?.finishedCount ?? 0 },
  { label: "Still on the Path", icon: "i-lucide-footprints", value: props.stats?.onTheWayCount ?? 0 },
]);
</script>

<template>
  <div v-if="stats" class="flex flex-col gap-2 rounded-lg bg-elevated pt-3">
    <h2 class="flex items-center gap-2 px-4 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-rose" class="size-4" />
      The Journey So Far
    </h2>

    <ul class="flex flex-col divide-y divide-accented">
      <li
        v-for="tile in tiles"
        :key="tile.label"
        class="flex items-center gap-3 px-4 py-1.5"
      >
        <UIcon :name="tile.icon" class="size-5 shrink-0 text-primary" />
        <span class="flex-1 truncate text-sm text-muted">{{ tile.label }}</span>
        <span class="text-lg font-bold tabular-nums text-highlighted"><NumberMotif :text="tile.value.toLocaleString()" /></span>
      </li>
    </ul>
  </div>
</template>
