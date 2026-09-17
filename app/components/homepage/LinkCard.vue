<script setup lang="ts">
interface Props {
  to: string
  icon: string
  title: string
  description: string
}

defineProps<Props>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-3 rounded-lg bg-elevated p-4 hover:bg-accented/50"
  >
    <UIcon
      :name="icon"
      class="size-8 shrink-0 text-secondary"
    />
    <div class="flex min-w-0 flex-col">
      <span class="text-sm font-semibold text-highlighted">
        <NumberMotif :text="title" />
      </span>
      <span class="text-xs text-muted group-hover:text-highlighted">
        <NumberMotif :text="description" />
      </span>
    </div>
  </NuxtLink>
</template>
