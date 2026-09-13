<script setup lang="ts">
interface Props {
  title?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  icon: undefined,
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 v-if="title" class="flex items-center gap-2 text-base font-semibold text-highlighted">
      <UIcon v-if="icon" :name="icon" class="size-5" />
      <span>{{ title }}</span>
    </h2>
    <div class="flex flex-col gap-4 sm:flex-row">
      <div class="min-w-0 flex-1">
        <slot name="left" />
      </div>
      <div class="min-w-0 flex-1">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
