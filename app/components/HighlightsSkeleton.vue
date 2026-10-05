<script setup lang="ts">
// A column of card-sized placeholders for community highlights (leaderboards,
// spotlights, birthdays) while they load in the browser on a cached page - see
// the page-caching spec. Shown instead of empty or zero-count cards.
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3
})
</script>

<template>
  <div
    class="flex flex-col gap-6"
    aria-busy="true"
    aria-label="Loading"
  >
    <USkeleton
      v-for="index in count"
      :key="index"
      class="h-40 rounded-lg"
    />
  </div>
</template>
