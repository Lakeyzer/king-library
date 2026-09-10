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
  <tr
    class="group"
    :class="{ 'cursor-pointer hover:bg-elevated': to }"
    @click="handleRowClick"
  >
    <td class="w-16 py-2 pl-3 pr-3">
      <ImageThumbnail
        :src="src"
        :alt="imageAlt"
        :placeholder-icon="placeholderIcon"
        size="sm"
      />
    </td>

    <td class="min-w-0 py-2 pr-4">
      <p class="truncate font-medium text-highlighted" :class="{ 'group-hover:text-primary': to }">
        {{ title }}
      </p>
      <p class="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span v-if="releaseYear !== null">{{ releaseYear }}</span>
        <span>{{ typeLabel }}</span>
      </p>
    </td>

    <td class="py-2 pr-3" @click.stop>
      <div class="flex shrink-0 items-center justify-end gap-2">
        <slot name="actions" />
      </div>
    </td>
  </tr>
</template>
