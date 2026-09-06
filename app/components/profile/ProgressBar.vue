<script setup lang="ts">
interface Props {
  label: string;
  icon: string;
  count: number;
  total: number;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "neutral";
  hint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  hint: undefined,
});

const percent = computed(() =>
  props.total > 0 ? Math.round((props.count / props.total) * 100) : 0,
);
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-elevated p-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
        <UIcon :name="icon" class="size-4" />
        <span>{{ label }}</span>
      </div>
      <span class="text-2xl font-bold tabular-nums text-highlighted">{{
        percent
      }}%</span>
    </div>

    <UProgress :model-value="count" :max="total" :color="color" size="lg" />

    <div class="flex items-center justify-between text-xs text-muted">
      <span>{{ count }} / {{ total }}</span>
      <span v-if="hint">{{ hint }}</span>
    </div>
  </div>
</template>
