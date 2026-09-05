<script setup lang="ts">
interface Props {
  src: string | null
  alt: string
  placeholderIcon: string
  size?: 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm'
})

const hasError = ref(false)

watch(() => props.src, () => {
  hasError.value = false
})
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded bg-elevated"
    :class="size === 'lg' ? 'h-40 w-28' : 'h-24 w-15'"
  >
    <UIcon
      v-if="!src || hasError"
      :name="placeholderIcon"
      :class="size === 'lg' ? 'size-10' : 'size-6'"
      class="text-muted"
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
