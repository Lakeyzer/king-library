<script setup lang="ts">
interface Props {
  src: string | null
  alt: string
  placeholderIcon: string
  size?: 'xs' | 'sm' | 'lg' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm'
})

const hasError = ref(false)

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  xs: 'h-10 w-7',
  sm: 'h-24 w-15',
  lg: 'h-40 w-28',
  full: 'w-full aspect-[2/3]'
}

const ICON_SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  xs: 'size-4',
  sm: 'size-6',
  lg: 'size-10',
  full: 'size-12'
}

watch(() => props.src, () => {
  hasError.value = false
})
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded bg-elevated"
    :class="SIZE_CLASSES[size]"
  >
    <UIcon
      v-if="!src || hasError"
      :name="placeholderIcon"
      :class="ICON_SIZE_CLASSES[size]"
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
