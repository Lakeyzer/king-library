<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface Props {
  adaptationId: string;
  mode?: "compact" | "expanded";
}

const props = withDefaults(defineProps<Props>(), {
  mode: "compact",
});

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

// Compact mode's single primary action mirrors BookReadingActions: it
// always advances straight to "watched" (skipping the watchlist toggle),
// with "watched" reversing itself - the watchlist toggle moves into the
// overflow menu instead of taking a second row of buttons.
type PrimaryState = "neutral" | "want_to_watch" | "watched";

const primaryState = computed<PrimaryState>(() => {
  if (isWatched.value) return "watched";
  if (isWantToWatch.value) return "want_to_watch";
  return "neutral";
});

const primaryLabel = computed(() =>
  primaryState.value === "watched" ? "Mark as Unwatched" : "Mark as Watched"
);

function handlePrimaryClick() {
  handleWatchedToggle();
}

const dropdownItems = computed<DropdownMenuItem[]>(() => {
  switch (primaryState.value) {
    case "neutral":
      return [
        {
          label: "Add to Watchlist",
          icon: "i-lucide-bookmark",
          onSelect: handleWatchlistToggle,
        },
      ];
    case "want_to_watch":
      return [
        {
          label: "Remove from Watchlist",
          icon: "i-lucide-bookmark-x",
          onSelect: handleWatchlistToggle,
        },
      ];
    case "watched":
      return [];
  }
});
</script>

<template>
  <template v-if="user">
    <UFieldGroup v-if="mode === 'compact'">
      <UButton
        :label="primaryLabel"
        icon="i-lucide-circle-check"
        color="neutral"
        variant="subtle"
        @click="handlePrimaryClick"
      />

      <UDropdownMenu
        v-if="dropdownItems.length"
        :items="dropdownItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-chevron-down"
          color="neutral"
          variant="subtle"
          aria-label="More watch actions"
        />
      </UDropdownMenu>
      <UButton
        v-else
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="subtle"
        disabled
        aria-label="No other watch actions available"
      />
    </UFieldGroup>

    <template v-else>
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
</template>
