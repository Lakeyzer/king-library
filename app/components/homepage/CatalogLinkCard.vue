<script setup lang="ts">
interface Props {
  to: string;
  icon: string;
  label: string;
  count: number;
}

defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-3 rounded-lg bg-elevated p-4 hover:bg-accented/50"
  >
    <UIcon :name="icon" class="size-6 shrink-0 text-primary" />
    <div class="flex flex-col">
      <span class="text-2xl font-bold tabular-nums text-highlighted">{{ count.toLocaleString() }}</span>
      <span class="text-xs text-muted group-hover:text-highlighted">{{ label }}</span>
    </div>
  </NuxtLink>
</template>
