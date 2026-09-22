<script setup lang="ts">
import type { WorkHighlight } from '~/composables/useBooks'

interface Props {
  heading: string
  icon: string
  work: WorkHighlight | null
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="work"
    class="flex flex-col gap-3 rounded-lg bg-elevated p-4"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        :name="icon"
        class="size-4"
      />
      {{ heading }}
    </h2>

    <WorkTile :work="work" />
  </div>
</template>
