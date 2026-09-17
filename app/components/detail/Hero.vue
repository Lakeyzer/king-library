<script setup lang="ts">
interface Props {
  imageSrc: string | null;
  imageAlt: string;
  imagePlaceholderIcon: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
    <div
      class="flex h-72 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated max-sm:self-center"
    >
      <UIcon
        v-if="!imageSrc"
        :name="imagePlaceholderIcon"
        class="size-12 text-muted"
      />
      <NuxtImg
        v-else
        provider="none"
        :src="imageSrc"
        :alt="imageAlt"
        class="h-full w-full object-cover"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4 max-sm:order-3">
      <slot />
    </div>

    <div
      v-if="$slots.related"
      class="h-72 w-48 shrink-0 overflow-x-hidden overflow-y-auto scrollbar-none max-sm:order-4 max-sm:w-full"
    >
      <slot name="related" />
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-col items-center gap-4 max-sm:order-2 sm:basis-full lg:flex-row lg:justify-between lg:rounded-lg lg:bg-elevated lg:px-4 lg:py-2"
    >
      <slot name="actions" />

      <!--
        The bg-elevated box only exists from lg up now, so this copy (the
        one sharing that box) only needs to render there too - the sibling
        below takes over for everything under lg, centered the same way
        the old max-sm-only treatment was. Two copies of the same slot
        content rather than one that moves, since a slot's DOM position
        can't respond to a breakpoint on its own.
      -->
      <div
        v-if="$slots.stats"
        class="hidden lg:flex lg:flex-wrap lg:gap-x-4 lg:gap-y-1 lg:text-sm lg:text-muted"
      >
        <slot name="stats" />
      </div>
    </div>

    <!--
      Below lg: stats sit centered under the actions box, no background -
      see the comment above. `w-full` matters here for the same reason
      `sm:basis-full` does on the actions box itself: this outer wrapper is
      `sm:flex-row sm:flex-wrap` from sm up, so without forcing full width
      this would sit beside whatever has room next to it in the wrap
      instead of starting its own line directly under the actions box.
      `max-sm:order-2` matches the actions box's own mobile order - without
      it this tied the *cover image's* order (0, the default) instead, and
      being later in the DOM than the cover but earlier than actions'
      order-2, it rendered between them: above the actions box instead of
      below it. Matching the same order value and letting DOM position
      break the tie (this div comes after the actions box in the template)
      puts it right after, same as sm+ already does via the order-0 tie
      there.
    -->
    <div
      v-if="$slots.actions && $slots.stats"
      class="flex w-full flex-wrap justify-center gap-x-4 gap-y-1 text-center text-sm text-muted max-sm:order-2 lg:hidden"
    >
      <slot name="stats" />
    </div>
  </div>
</template>
