<script setup lang="ts">
interface Props {
  src: string | null;
  imageAlt: string;
  placeholderIcon: string;
  title: string;
  releaseYear: number | null;
  typeLabel: string;
  to?: string;
}

const props = defineProps<Props>();

function handleRowClick() {
  if (props.to) navigateTo(props.to);
}
</script>

<template>
  <li
    class="group flex items-center gap-3 py-2 pl-3 pr-3"
    :class="{ 'cursor-pointer hover:bg-elevated': to }"
    @click="handleRowClick"
  >
    <div class="shrink-0">
      <ImageThumbnail
        :src="src"
        :alt="imageAlt"
        :placeholder-icon="placeholderIcon"
        size="sm"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-highlighted" :class="{ 'group-hover:text-primary': to }">
        {{ title }}
      </p>
      <p class="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span v-if="releaseYear !== null">{{ releaseYear }}</span>
        <span>{{ typeLabel }}</span>
      </p>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2" @click.stop>
      <slot name="actions" />
    </div>
  </li>
</template>
