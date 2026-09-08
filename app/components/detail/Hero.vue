<script setup lang="ts">
interface Props {
  imageSrc: string | null;
  imageAlt: string;
  imagePlaceholderIcon: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
    <div
      class="flex h-72 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated max-sm:self-center"
    >
      <UIcon
        v-if="!imageSrc"
        :name="imagePlaceholderIcon"
        class="size-12 text-muted"
      />
      <NuxtImg
        v-else
        provider="none"
        :src="imageSrc"
        :alt="imageAlt"
        class="h-full w-full object-cover"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4 max-sm:order-3">
      <slot />
    </div>

    <div
      v-if="$slots.related"
      class="h-72 w-48 shrink-0 overflow-x-hidden overflow-y-auto scrollbar-none max-sm:order-4 max-sm:w-full"
    >
      <slot name="related" />
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-col gap-4 rounded-lg bg-elevated px-4 py-2 max-sm:order-2 max-sm:bg-transparent max-sm:p-0 sm:basis-full sm:flex-row sm:items-center sm:justify-between"
    >
      <slot name="actions" />

      <div
        v-if="$slots.stats"
        class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted max-sm:w-full max-sm:justify-center max-sm:text-center"
      >
        <slot name="stats" />
      </div>
    </div>
  </div>
</template>
