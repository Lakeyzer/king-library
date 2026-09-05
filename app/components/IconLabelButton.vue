<script setup lang="ts">
interface Props {
  label: string;
  icon: string;
  /** Renders the icon filled (solid) rather than outline - e.g. to show a toggle is currently on. */
  filled?: boolean;
  disabled?: boolean;
  /** Icon-above-label layout for use inside a full-width UFieldGroup on small screens. */
  stacked?: boolean;
}

withDefaults(defineProps<Props>(), {
  filled: false,
  disabled: false,
  stacked: false,
});
</script>

<template>
  <UButton
    color="neutral"
    variant="subtle"
    :disabled="disabled"
    :class="stacked ? 'h-auto flex-col gap-1 px-2 py-2' : undefined"
  >
    <UIcon
      :name="icon"
      mode="svg"
      class="shrink-0"
      :class="[stacked ? 'size-6' : 'size-5', { 'icon-filled': filled }]"
    />
    <span
      :class="
        stacked
          ? 'block w-16 text-center text-xs font-normal leading-tight'
          : 'truncate text-sm'
      "
    >
      {{ label }}
    </span>
  </UButton>
</template>
