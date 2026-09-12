<script setup lang="ts">
import type { WorkHighlight } from "~/composables/useBooks";

interface Props {
  work: WorkHighlight;
  meta?: string;
  size?: "xs" | "sm";
  showActions?: boolean;
}

withDefaults(defineProps<Props>(), { size: "xs", showActions: true });
</script>

<template>
  <div class="flex items-center gap-2">
    <NuxtLink
      :to="`/works/${work.slug}`"
      class="group flex min-w-0 flex-1 items-center gap-2"
    >
      <ImageThumbnail
        :src="work.coverId ? getOpenLibraryCoverUrl(work.coverId, 'S') : null"
        :alt="`${work.title} cover`"
        placeholder-icon="i-lucide-book"
        :size="size"
      />

      <div class="flex min-w-0 flex-1 flex-col">
        <p class="truncate text-sm font-medium text-highlighted group-hover:text-primary">
          <NumberMotif :text="work.title" />
        </p>
        <p v-if="meta" class="text-xs text-muted"><NumberMotif :text="meta" /></p>
      </div>
    </NuxtLink>

    <BookReadingActions
      v-if="showActions"
      :work-id="work.id"
      :work-title="work.title"
      mode="compact"
      class="shrink-0"
    />
  </div>
</template>
