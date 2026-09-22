<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  description: string
}

withDefaults(defineProps<Props>(), {
  icon: undefined
})
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <div class="flex flex-col gap-1">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-4"
        />
        <span><NumberMotif :text="title" /></span>
      </h3>
      <p class="text-xs text-muted">
        <NumberMotif :text="description" />
      </p>
    </div>

    <div class="h-70 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
