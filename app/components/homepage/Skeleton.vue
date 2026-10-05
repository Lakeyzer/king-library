<script setup lang="ts">
// Stands in for the homepage's catalog row, leaderboards and spotlights while
// they load in the browser (the page is cached, so they're never in its HTML -
// see the page-caching spec). Mirrors the real layout - the three catalog
// cards on top, the wide leaderboard column and the narrow spotlight column
// beneath - so the page doesn't jump when the real sections replace it.
const LEADERBOARD_COUNT = 4
const SPOTLIGHT_COUNT = 5
</script>

<template>
  <div
    class="flex flex-col gap-6 py-8"
    aria-busy="true"
    aria-label="Loading"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-19 rounded-lg"
      />
    </div>

    <div class="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
      <div class="flex flex-1 flex-col gap-6">
        <USkeleton
          v-for="index in LEADERBOARD_COUNT"
          :key="index"
          class="h-80 rounded-lg"
        />
      </div>

      <div class="flex w-full flex-col gap-6 lg:w-96 lg:shrink-0">
        <USkeleton
          v-for="index in SPOTLIGHT_COUNT"
          :key="index"
          class="h-40 rounded-lg"
        />
      </div>
    </div>
  </div>
</template>
