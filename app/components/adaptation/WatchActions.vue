<script setup lang="ts">
interface Props {
  adaptationId: string;
}

const props = defineProps<Props>();

const user = useSupabaseUser();
const { userAdaptationsByAdaptationId, toggleWantToWatch, markWatched, unmarkWatched } = useAdaptations();

const userAdaptation = computed(() => userAdaptationsByAdaptationId.value[props.adaptationId]);
const isWantToWatch = computed(() => userAdaptation.value?.want_to_watch ?? false);
const isWatched = computed(() => userAdaptation.value?.watched ?? false);

const watchlistLabel = computed(() =>
  isWantToWatch.value ? "Remove from Watchlist" : "Add to Watchlist"
);
const watchedLabel = computed(() => (isWatched.value ? "Mark as Unwatched" : "Mark as Watched"));

function handleWatchlistToggle() {
  toggleWantToWatch(props.adaptationId);
}

function handleWatchedToggle() {
  if (isWatched.value) {
    unmarkWatched(props.adaptationId);
  } else {
    markWatched(props.adaptationId);
  }
}
</script>

<template>
  <template v-if="user">
    <UFieldGroup class="hidden max-sm:flex max-sm:w-full">
      <IconLabelButton
        stacked
        class="flex-1"
        :label="watchlistLabel"
        icon="i-lucide-bookmark"
        :filled="isWantToWatch"
        :disabled="isWatched"
        @click="handleWatchlistToggle"
      />
      <IconLabelButton
        stacked
        class="flex-1"
        :label="watchedLabel"
        icon="i-lucide-circle-check"
        :filled="isWatched"
        @click="handleWatchedToggle"
      />
    </UFieldGroup>

    <div class="hidden flex-nowrap gap-2 sm:flex">
      <IconLabelButton
        :label="watchlistLabel"
        icon="i-lucide-bookmark"
        :filled="isWantToWatch"
        :disabled="isWatched"
        @click="handleWatchlistToggle"
      />
      <IconLabelButton
        :label="watchedLabel"
        icon="i-lucide-circle-check"
        :filled="isWatched"
        @click="handleWatchedToggle"
      />
    </div>
  </template>
</template>
