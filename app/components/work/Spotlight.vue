<script setup lang="ts">
import type { WorkHighlight } from "~/composables/useBooks";

interface Props {
  title: string;
  icon: string;
  work: WorkHighlight | null;
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

    <UEmpty v-if="!work" :description="emptyMessage" />
    <WorkTile v-else :work="work" :meta="meta" />
  </div>
</template>
