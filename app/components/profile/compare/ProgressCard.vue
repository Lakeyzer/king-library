<script setup lang="ts">
interface Props {
  title: string;
  icon: string;
  ownLabel: string;
  ownCount: number;
  ownTotal: number;
  targetLabel: string;
  targetCount: number;
  targetTotal: number;
}

const props = defineProps<Props>();

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

const diff = computed(() => props.ownCount - props.targetCount);
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg bg-elevated p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon :name="icon" class="size-4" />
        <span>{{ title }}</span>
      </h3>
      <UBadge
        v-if="diff !== 0"
        :color="diff > 0 ? 'success' : 'error'"
        variant="subtle"
        :icon="diff > 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
        :label="diff > 0 ? `+${diff}` : `${diff}`"
      />
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="max-w-[60%] truncate text-xs font-medium uppercase tracking-wide text-muted">
          <NumberMotif :text="ownLabel" />
        </span>
        <div class="flex items-end justify-between gap-2">
          <span class="text-lg font-bold leading-none tabular-nums text-highlighted">
            <NumberMotif :text="`${ownCount} / ${ownTotal}`" />
          </span>
          <span class="text-xs font-medium leading-none tabular-nums text-muted">
            <NumberMotif :text="`${percent(ownCount, ownTotal)}%`" />
          </span>
        </div>
        <UProgress
          :model-value="ownCount"
          :max="ownTotal"
          color="primary"
          size="md"
          :title="`${ownLabel}: ${ownCount} / ${ownTotal}`"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="max-w-[60%] truncate text-xs font-medium uppercase tracking-wide text-muted">
          <NumberMotif :text="targetLabel" />
        </span>
        <div class="flex items-end justify-between gap-2">
          <span class="text-lg font-bold leading-none tabular-nums text-highlighted">
            <NumberMotif :text="`${targetCount} / ${targetTotal}`" />
          </span>
          <span class="text-xs font-medium leading-none tabular-nums text-muted">
            <NumberMotif :text="`${percent(targetCount, targetTotal)}%`" />
          </span>
        </div>
        <UProgress
          :model-value="targetCount"
          :max="targetTotal"
          color="warning"
          size="md"
          :title="`${targetLabel}: ${targetCount} / ${targetTotal}`"
        />
      </div>
    </div>
  </div>
</template>
