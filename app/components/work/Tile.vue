<script setup lang="ts">
import type { WorkHighlight } from "~/composables/useBooks";

interface Props {
  work: WorkHighlight;
  meta?: string;
  size?: "xs" | "sm";
}

withDefaults(defineProps<Props>(), { size: "xs" });
</script>

<template>
  <NuxtLink
    :to="`/works/${work.slug}`"
    class="group flex items-center gap-2"
  >
    <ImageThumbnail
      :src="work.coverId ? getOpenLibraryCoverUrl(work.coverId, 'S') : null"
      :alt="`${work.title} cover`"
      placeholder-icon="i-lucide-book"
      :size="size"
    />

    <div class="flex min-w-0 flex-1 flex-col">
      <p class="truncate text-sm font-medium text-highlighted group-hover:text-primary">
        {{ work.title }}
      </p>
      <p v-if="meta" class="text-xs text-muted">{{ meta }}</p>
    </div>
  </NuxtLink>
</template>
