<script setup lang="ts">
defineProps<{
  src: string | null;
  imageAlt: string;
  placeholderIcon: string;
  title: string;
  releaseYear: number | null;
  typeLabel: string;
}>();
</script>

<template>
  <li class="flex gap-4 p-3 bg-neutral-500/5 dark:bg-black/10 rounded">
    <ImageThumbnail
      :src="src"
      :alt="imageAlt"
      :placeholder-icon="placeholderIcon"
    />

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
      <p class="truncate font-medium">
        {{ title }}
      </p>

      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span v-if="releaseYear !== null">{{ releaseYear }}</span>
          <span>{{ typeLabel }}</span>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </li>
</template>
