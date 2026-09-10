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

// The primary action (handlePrimaryClick) is always the first item, since
// compact mode folds it into this single dropdown rather than giving it its
// own button.
const dropdownItems = computed<DropdownMenuItem[]>(() => {
  const primary: DropdownMenuItem = {
    label: primaryLabel.value,
    icon: "i-lucide-circle-check",
    onSelect: handlePrimaryClick,
  };

  switch (primaryState.value) {
    case "neutral":
      return [
        primary,
        {
          label: "Add to Watchlist",
          icon: "i-lucide-bookmark",
          onSelect: handleWatchlistToggle,
        },
      ];
    case "want_to_watch":
      return [
        primary,
        {
          label: "Remove from Watchlist",
          icon: "i-lucide-bookmark-x",
          onSelect: handleWatchlistToggle,
        },
      ];
    case "watched":
      return [primary];
  }
});
</script>

<template>
  <template v-if="user">
    <div v-if="mode === 'compact'" class="flex items-center gap-1">
      <UTooltip v-if="isWantToWatch" text="On Watchlist">
        <UIcon name="i-lucide-bookmark" class="size-5 text-muted" />
      </UTooltip>
      <UTooltip v-if="isWatched" text="Watched">
        <UIcon name="i-lucide-circle-check" class="size-5 text-muted" />
      </UTooltip>

      <UDropdownMenu :items="dropdownItems" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="subtle"
          aria-label="Watch actions"
        />
      </UDropdownMenu>
    </div>

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
