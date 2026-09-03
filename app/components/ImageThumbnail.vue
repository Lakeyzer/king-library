<script setup lang="ts">
const props = defineProps<{
  src: string | null
  alt: string
  placeholderIcon: string
}>()

const hasError = ref(false)

watch(() => props.src, () => {
  hasError.value = false
})
</script>

<template>
  <div class="flex h-24 w-15 shrink-0 items-center justify-center overflow-hidden rounded bg-elevated">
    <UIcon
      v-if="!src || hasError"
      :name="placeholderIcon"
      class="size-6 text-muted"
    />
    <NuxtImg
      v-else
      provider="none"
      :src="src"
      :alt="alt"
      loading="lazy"
      class="h-full w-full object-cover"
      @error="hasError = true"
    />
  </div>
</template>
