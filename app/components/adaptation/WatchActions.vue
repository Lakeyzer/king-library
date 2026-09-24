<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

interface Props {
  adaptationId: string
  mode?: 'compact' | 'expanded'
  /** ISO YYYY-MM-DD release date (a series' first air date). While it's in the future, Mark as Watched is disabled - the watchlist stays available, and so does Mark as Unwatched on something already watched. */
  releaseDate?: string | null
  /** Fallback when there's no releaseDate: unreleased once it's after the current year. */
  releaseYear?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'compact',
  releaseDate: null,
  releaseYear: null
})

defineOptions({ inheritAttrs: false })

const user = useSupabaseUser()
// userAdaptationsByAdaptationId is only populated once something calls
// fetchUserAdaptations() - this component does NOT do that itself. Any page
// rendering this (directly or via AdaptationTile) must await
// useAsyncData("user-adaptations", fetchUserAdaptations) itself, or every
// tile silently shows neutral status regardless of the user's actual watch
// state - see nuxt-conventions "BookReadingActions / AdaptationWatchActions
// need their page to pre-fetch status" for why this isn't just pushed into
// this component.
const { userAdaptationsByAdaptationId, toggleWantToWatch, markWatched, unmarkWatched } = useAdaptations()
const { open: openAuthModal } = useAuthModal()

const userAdaptation = computed(() => userAdaptationsByAdaptationId.value[props.adaptationId])
const isWantToWatch = computed(() => userAdaptation.value?.want_to_watch ?? false)
const isWatched = computed(() => userAdaptation.value?.watched ?? false)

const watchlistLabel = computed(() =>
  isWantToWatch.value ? 'Remove from Watchlist' : 'Add to Watchlist'
)
const watchedLabel = computed(() => (isWatched.value ? 'Mark as Unwatched' : 'Mark as Watched'))

const watchBlocked = computed(
  () => isUnreleasedAdaptation(props.releaseDate, props.releaseYear) && !isWatched.value
)
const unreleasedTitle = 'Not released yet'

// Available to a signed-out visitor too (not hidden) - both handlers open
// the sign-in modal instead of acting, so a visitor sees what's possible
// and gets prompted to sign in rather than the whole control disappearing.
function handleWatchlistToggle() {
  if (!user.value) {
    openAuthModal()
    return
  }
  toggleWantToWatch(props.adaptationId)
}

function handleWatchedToggle() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (isWatched.value) {
    unmarkWatched(props.adaptationId)
  } else {
    markWatched(props.adaptationId)
  }
}

// Compact mode's single primary action mirrors BookReadingActions: it
// always advances straight to "watched" (skipping the watchlist toggle),
// with "watched" reversing itself - the watchlist toggle moves into the
// overflow menu instead of taking a second row of buttons.
type PrimaryState = 'neutral' | 'want_to_watch' | 'watched'

const primaryState = computed<PrimaryState>(() => {
  if (isWatched.value) return 'watched'
  if (isWantToWatch.value) return 'want_to_watch'
  return 'neutral'
})

const primaryLabel = computed(() =>
  primaryState.value === 'watched' ? 'Mark as Unwatched' : 'Mark as Watched'
)

function handlePrimaryClick() {
  handleWatchedToggle()
}

// The primary action (handlePrimaryClick) is always the first item, since
// compact mode folds it into this single dropdown rather than giving it its
// own button.
const dropdownItems = computed<DropdownMenuItem[]>(() => {
  const primary: DropdownMenuItem = {
    label: primaryLabel.value,
    icon: 'i-lucide-circle-check',
    disabled: watchBlocked.value,
    onSelect: handlePrimaryClick
  }

  switch (primaryState.value) {
    case 'neutral':
      return [
        primary,
        {
          label: 'Add to Watchlist',
          icon: 'i-lucide-bookmark',
          onSelect: handleWatchlistToggle
        }
      ]
    case 'want_to_watch':
      return [
        primary,
        {
          label: 'Remove from Watchlist',
          icon: 'i-lucide-bookmark-x',
          onSelect: handleWatchlistToggle
        }
      ]
    case 'watched':
      return [primary]
    default:
      return [primary]
  }
})
</script>

<template>
  <div
    v-if="mode === 'compact'"
    class="flex items-center gap-1"
    v-bind="$attrs"
  >
    <UTooltip
      v-if="isWantToWatch"
      text="On Watchlist"
    >
      <UIcon
        name="i-lucide-bookmark"
        class="size-5 text-muted"
      />
    </UTooltip>
    <UTooltip
      v-if="isWatched"
      text="Watched"
    >
      <UIcon
        name="i-lucide-circle-check"
        class="size-5 text-muted"
      />
    </UTooltip>

    <UDropdownMenu
      :items="dropdownItems"
      :content="{ align: 'end' }"
    >
      <UButton
        icon="i-lucide-ellipsis-vertical"
        color="neutral"
        variant="subtle"
        aria-label="Watch actions"
      />
    </UDropdownMenu>
  </div>

  <template v-else>
    <UFieldGroup
      class="hidden max-sm:flex max-sm:w-full"
      v-bind="$attrs"
    >
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
        :disabled="watchBlocked"
        :title="watchBlocked ? unreleasedTitle : undefined"
        @click="handleWatchedToggle"
      />
    </UFieldGroup>

    <div
      class="hidden flex-nowrap gap-2 sm:flex"
      v-bind="$attrs"
    >
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
        :disabled="watchBlocked"
        :title="watchBlocked ? unreleasedTitle : undefined"
        @click="handleWatchedToggle"
      />
    </div>
  </template>
</template>
