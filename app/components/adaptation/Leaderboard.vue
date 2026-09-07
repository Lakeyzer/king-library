<script setup lang="ts">
import type { AdaptationLeaderboardEntry } from "~/composables/useAdaptations";

interface Props {
  title: string;
  icon: string;
  items: AdaptationLeaderboardEntry[];
  countLabel: (count: number) => string;
  emptyMessage: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated pt-3">
    <h2 class="flex items-center gap-2 px-4 text-sm font-semibold text-highlighted">
      <UIcon :name="icon" class="size-4" />
      {{ title }}
    </h2>

    <UEmpty v-if="!items.length" class="px-4" :description="emptyMessage" />

    <ul v-else class="flex flex-col divide-y divide-accented">
      <li v-for="item in items" :key="item.id">
        <AdaptationTile
          :adaptation="item"
          :meta="countLabel(item.count)"
          class="px-4 py-1.5 hover:bg-accented/50"
        />
      </li>
    </ul>
  </div>
</template>
