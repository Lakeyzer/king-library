<script setup lang="ts">
import { NuxtLink } from "#components";

interface Props {
  src: string | null;
  imageAlt: string;
  placeholderIcon: string;
  title: string;
  releaseYear: number | null;
  typeLabel: string;
  to?: string;
}

defineProps<Props>();
</script>

<template>
  <li class="flex items-center gap-4 p-3 bg-neutral-500/5 dark:bg-black/10 rounded">
    <component
      :is="to ? NuxtLink : 'div'"
      :to="to"
      class="group flex min-w-0 flex-1 gap-4"
    >
      <ImageThumbnail
        :src="src"
        :alt="imageAlt"
        :placeholder-icon="placeholderIcon"
      />

      <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p class="truncate font-medium" :class="{ 'group-hover:underline': to }">
          {{ title }}
        </p>

        <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span v-if="releaseYear !== null">{{ releaseYear }}</span>
          <span>{{ typeLabel }}</span>
        </div>
      </div>
    </component>

    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </li>
</template>
