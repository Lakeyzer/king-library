<script setup lang="ts">
import type { AdaptationHighlight } from "~/composables/useAdaptations";

interface Props {
  title: string;
  icon: string;
  adaptation: AdaptationHighlight | null;
  meta?: string;
  emptyMessage: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon :name="icon" class="size-4" />
      {{ title }}
    </h2>

    <UEmpty v-if="!adaptation" :description="emptyMessage" />
    <AdaptationTile v-else :adaptation="adaptation" :meta="meta" />
  </div>
</template>
