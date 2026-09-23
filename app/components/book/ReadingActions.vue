<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

interface Props {
  workId: string
  workTitle: string
  /** Open Library work key - needed to open the Add to Shelf editions picker. When absent, Add to Shelf falls back to a plain owned toggle. */
  workKey?: string | null
  mode?: 'compact' | 'expanded'
  /** Compact mode only - shrinks the status icons and the dropdown trigger button. 'md' (default) matches the original size; 'sm' is for denser layouts like a carousel card footer. */
  size?: 'sm' | 'md'
  /** 'king' (default) reads/writes king_works via useBooks()/useBookshelf(); 'related' reads/writes related_works via useRelatedWorks()/useRelatedWorkEditions() - see reading-status's "Works by Others share the same reading-status controls". A related work has no reread-history (Read Again) - hidden/redirected below wherever domain is 'related' - but otherwise shares every reading-status control, including BookFinishReadingModal, identically with King. */
  domain?: 'king' | 'related'
  /** True when this renders inside another interactive element's own <button> (e.g. an accordion trigger) - swaps compact mode's dropdown-menu trigger to a non-button tag, since a <button> cannot validly contain another <button>. Reka's DropdownMenuTrigger still sets the right aria-* attributes and keyboard handling regardless of the underlying tag. */
  nested?: boolean
  /** Forwarded to the Add to Shelf editions picker - see WorkEditionList's own doc on minEditionYear/maxEditionYear. */
  minEditionYear?: number | null
  maxEditionYear?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  workKey: null,
  mode: 'compact',
  size: 'md',
  domain: 'king',
  nested: false,
  minEditionYear: null,
  maxEditionYear: null
})

const statusIconClass = computed(() => (props.size === 'sm' ? 'size-4' : 'size-5'))

defineOptions({ inheritAttrs: false })

const user = useSupabaseUser()
// userBooksByWorkId/userRelatedWorksByWorkId are only populated once
// something calls fetchUserBooks()/fetchUserRelatedWorks() - this component
// does NOT do that itself. Any page rendering this (directly or via
// WorkTile) must await useAsyncData(...) for the relevant fetch itself, or
// every tile silently shows neutral status regardless of the user's actual
// reading state - see nuxt-conventions "BookReadingActions... need their
// page to pre-fetch status" for why this isn't just pushed into this
// component.
const { userBooksByWorkId, toggleWantToRead: toggleWantToReadBook, setOwned: setBookOwned } = useBooks()
const {
  userRelatedWorksByWorkId,
  toggleWantToRead: toggleWantToReadRelated,
  setOwned: setRelatedOwned,
  unmarkRead: unmarkRelatedRead
} = useRelatedWorks()
const { open: openAuthModal } = useAuthModal()

const isRelated = computed(() => props.domain === 'related')

const showEditionsModal = ref(false)

const bookState = computed(() => userBooksByWorkId.value[props.workId])
const relatedState = computed(() => userRelatedWorksByWorkId.value[props.workId])

const isOwned = computed(() => (isRelated.value ? relatedState.value?.owned : bookState.value?.owned) ?? false)
const isWantToRead = computed(
  () => (isRelated.value ? relatedState.value?.want_to_read : bookState.value?.want_to_read) ?? false
)
const isCurrentlyReading = computed(
  () => (isRelated.value ? relatedState.value?.currently_reading : bookState.value?.currently_reading) ?? false
)
const isRead = computed(() => (isRelated.value ? relatedState.value?.read : bookState.value?.read) ?? false)
const currentStartedOn = computed(
  () => (isRelated.value ? relatedState.value?.started_on : bookState.value?.started_on) ?? null
)
const currentFormat = computed(() => (isRelated.value ? relatedState.value?.format : bookState.value?.format) ?? null)

function toggleWantToRead() {
  return isRelated.value ? toggleWantToReadRelated(props.workId) : toggleWantToReadBook(props.workId)
}

type PrimaryState = 'neutral' | 'want_to_read' | 'currently_reading' | 'read'

// currently_reading takes priority over read - a work already marked read
// can be started again (see reading-status "User can start reading a work
// with a start date"), and while that new session is in progress the
// relevant actions are "finish"/"mark as read directly", not
// "unmark"/"read again" (those apply once the work is read and NOT
// currently-reading - see "Read state in expanded mode").
const primaryState = computed<PrimaryState>(() => {
  if (isCurrentlyReading.value) return 'currently_reading'
  if (isRead.value) return 'read'
  if (isWantToRead.value) return 'want_to_read'
  return 'neutral'
})

const showStartReadingModal = ref(false)
const showFinishReadingModal = ref(false)
const showMarkReadModal = ref(false)
const showReadAgainModal = ref(false)
const showUnmarkReadModal = ref(false)

const PRIMARY_LABEL: Record<PrimaryState, string> = {
  neutral: 'Mark as Read',
  want_to_read: 'Start Reading',
  currently_reading: 'Finish',
  read: 'Mark as Unread'
}

const PRIMARY_ICON: Record<PrimaryState, string> = {
  neutral: 'i-lucide-circle-check',
  want_to_read: 'i-lucide-book-open',
  currently_reading: 'i-lucide-book-open',
  read: 'i-lucide-circle-check'
}

const primaryLabel = computed(() => PRIMARY_LABEL[primaryState.value])
const primaryIcon = computed(() => PRIMARY_ICON[primaryState.value])

function handlePrimaryClick() {
  switch (primaryState.value) {
    case 'neutral':
      showMarkReadModal.value = true
      break
    case 'want_to_read':
      showStartReadingModal.value = true
      break
    case 'currently_reading':
      showFinishReadingModal.value = true
      break
    case 'read':
      // A related work's unmark has nothing to lose confirming - no
      // reread-history to cascade-delete, unlike King's (see
      // useRelatedWorks.ts's own note on markRead).
      if (isRelated.value) {
        unmarkRelatedRead(props.workId)
      } else {
        showUnmarkReadModal.value = true
      }
      break
  }
}

// The primary action (whatever handlePrimaryClick does for the current state)
// is always the first item, since compact mode folds it into this single
// dropdown rather than giving it its own button.
const readingDropdownItems = computed<DropdownMenuItem[]>(() => {
  const primary: DropdownMenuItem = {
    label: primaryLabel.value,
    icon: primaryIcon.value,
    onSelect: handlePrimaryClick
  }

  switch (primaryState.value) {
    case 'neutral':
      return [
        primary,
        {
          label: 'Add to Readlist',
          icon: 'i-lucide-bookmark',
          onSelect: () => toggleWantToRead()
        },
        {
          label: 'Start Reading',
          icon: 'i-lucide-book-open',
          onSelect: () => {
            showStartReadingModal.value = true
          }
        }
      ]
    case 'want_to_read':
      return [
        primary,
        {
          label: 'Remove from Readlist',
          icon: 'i-lucide-bookmark-x',
          onSelect: () => toggleWantToRead()
        },
        {
          label: 'Mark as Read',
          icon: 'i-lucide-circle-check',
          onSelect: () => {
            showMarkReadModal.value = true
          }
        }
      ]
    case 'currently_reading':
      return [
        primary,
        {
          label: 'Mark as Read',
          icon: 'i-lucide-circle-check',
          onSelect: () => {
            showMarkReadModal.value = true
          }
        }
      ]
    case 'read':
      return [
        primary,
        // Read Again has no related-works equivalent (no reread-history table).
        ...(isRelated.value
          ? []
          : [
              {
                label: 'Read Again',
                icon: 'i-lucide-repeat',
                onSelect: () => {
                  showReadAgainModal.value = true
                }
              } satisfies DropdownMenuItem
            ]),
        {
          label: 'Start Reading',
          icon: 'i-lucide-book-open',
          onSelect: () => {
            showStartReadingModal.value = true
          }
        }
      ]
    default:
      return [primary]
  }
})

// Owning a work is independent of reading status, so Add to Shelf is
// available in every state - appended here rather than duplicated in each
// readingDropdownItems branch above. Shown regardless of workKey - see
// handleShelfClick for the fallback when there's no key to open a picker
// against.
const dropdownItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [
    ...readingDropdownItems.value,
    {
      label: shelfLabel.value,
      icon: 'i-lucide-library',
      onSelect: handleShelfClick
    }
  ]

  // Signed out, every item opens the sign-in modal instead of its usual
  // action - the actions themselves stay visible (not hidden) so a
  // signed-out visitor can see what's possible, rather than the whole
  // control disappearing. See nuxt-conventions/reading-status for why this
  // replaced the old "v-if=user, hide everything" behavior.
  if (!user.value) {
    return items.map(item => ({ ...item, onSelect: openAuthModal }))
  }

  return items
})

// Expanded mode caps out at 3 buttons (plus Shelf) by giving each state
// exactly one "leftmost" slot and one "read-related" slot, rather than
// showing every possible action as its own separate control - that
// approach (still described in the pre-reread-tracking reading-status
// spec) overflowed once Read Again and Start-from-read were added on top
// of the existing Mark as Unread, ballooning the read state alone to 5
// buttons. The leftmost slot is repurposed per state instead of adding a
// new control: readlist toggle where that's the relevant intent, hidden
// while currently-reading (nothing else meaningful to offer there), and
// Mark as Unread once read - reusing the space Mark as Unread otherwise
// used to share with Read Again in the read-related slot.
const showLeftmostSlot = computed(() => primaryState.value !== 'currently_reading')

const leftmostLabel = computed(() => {
  if (primaryState.value === 'read') return 'Mark as Unread'
  return isWantToRead.value ? 'Remove from Readlist' : 'Add to Readlist'
})

const leftmostIcon = computed(() =>
  primaryState.value === 'read' ? 'i-lucide-circle-check' : 'i-lucide-bookmark'
)

const leftmostFilled = computed(() =>
  primaryState.value === 'read' ? true : isWantToRead.value
)

function handleLeftmostClick() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (primaryState.value === 'read') {
    if (isRelated.value) {
      unmarkRelatedRead(props.workId)
    } else {
      showUnmarkReadModal.value = true
    }
  } else {
    toggleWantToRead()
  }
}

const startFinishLabel = computed(() =>
  isCurrentlyReading.value ? 'Finish Reading' : 'Start Reading'
)

// Read Again has no related-works equivalent (no reread-history table), so
// once a related work is read there's nothing left for this slot to offer -
// hidden only for that one combination. Every other state (including
// currently_reading, where this slot doubles as "Mark as Read with custom
// dates" alongside the primary Finish action) behaves identically for both
// domains.
const showReadSlot = computed(() => !(isRelated.value && isRead.value))

const readSlotLabel = computed(() =>
  primaryState.value === 'read' ? 'Read Again' : 'Mark as Read'
)

const readSlotIcon = computed(() =>
  primaryState.value === 'read' ? 'i-lucide-repeat' : 'i-lucide-circle-check'
)

// Read Again is a repeatable action, not a persisted on/off state, so it's
// never shown filled the way the (unaffected) "Mark as Read" branch still
// is for whatever residual `isRead` value applies there.
const readSlotFilled = computed(() => (primaryState.value === 'read' ? false : isRead.value))

function handleReadSlotClick() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (primaryState.value === 'read') {
    showReadAgainModal.value = true
  } else {
    showMarkReadModal.value = true
  }
}

const shelfLabel = computed(() =>
  isOwned.value ? 'On Shelf' : 'Add to Shelf'
)

function handleStartOrFinishReading() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (isCurrentlyReading.value) {
    showFinishReadingModal.value = true
  } else {
    showStartReadingModal.value = true
  }
}

function handleShelfClick() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (props.workKey) {
    showEditionsModal.value = true
  } else {
    const setOwned = isRelated.value ? setRelatedOwned : setBookOwned
    setOwned(props.workId, !isOwned.value)
  }
}
</script>

<template>
  <div
    v-if="mode === 'compact'"
    class="flex items-center gap-1"
    v-bind="$attrs"
  >
    <UTooltip
      v-if="isOwned"
      text="On Shelf"
    >
      <UIcon
        name="i-lucide-library"
        :class="statusIconClass"
        class="text-muted"
      />
    </UTooltip>
    <UTooltip
      v-if="isWantToRead"
      text="On Readlist"
    >
      <UIcon
        name="i-lucide-bookmark"
        :class="statusIconClass"
        class="text-muted"
      />
    </UTooltip>
    <UTooltip
      v-if="isCurrentlyReading"
      text="Currently Reading"
    >
      <UIcon
        name="i-lucide-book-open"
        :class="statusIconClass"
        class="text-muted"
      />
    </UTooltip>
    <UTooltip
      v-if="isRead"
      text="Read"
    >
      <UIcon
        name="i-lucide-circle-check"
        :class="statusIconClass"
        class="text-muted"
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
        :size="size"
        aria-label="Reading actions"
        v-bind="nested ? { as: 'div', role: 'button', tabindex: 0 } : {}"
      />
    </UDropdownMenu>
  </div>

  <template v-else>
    <UFieldGroup
      class="hidden max-sm:flex max-sm:w-full"
      v-bind="$attrs"
    >
      <IconLabelButton
        v-if="showLeftmostSlot"
        stacked
        class="flex-1"
        :label="leftmostLabel"
        :icon="leftmostIcon"
        :filled="leftmostFilled"
        @click="handleLeftmostClick"
      />
      <IconLabelButton
        stacked
        class="flex-1"
        :label="startFinishLabel"
        icon="i-lucide-book-open"
        :filled="isCurrentlyReading"
        @click="handleStartOrFinishReading"
      />
      <IconLabelButton
        v-if="showReadSlot"
        stacked
        class="flex-1"
        :label="readSlotLabel"
        :icon="readSlotIcon"
        :filled="readSlotFilled"
        @click="handleReadSlotClick"
      />
      <IconLabelButton
        stacked
        class="flex-1"
        :label="shelfLabel"
        icon="i-lucide-library"
        :filled="isOwned"
        @click="handleShelfClick"
      />
    </UFieldGroup>

    <div
      class="hidden flex-nowrap gap-2 sm:flex"
      v-bind="$attrs"
    >
      <IconLabelButton
        v-if="showLeftmostSlot"
        :label="leftmostLabel"
        :icon="leftmostIcon"
        :filled="leftmostFilled"
        @click="handleLeftmostClick"
      />
      <IconLabelButton
        :label="startFinishLabel"
        icon="i-lucide-book-open"
        :filled="isCurrentlyReading"
        @click="handleStartOrFinishReading"
      />
      <IconLabelButton
        v-if="showReadSlot"
        :label="readSlotLabel"
        :icon="readSlotIcon"
        :filled="readSlotFilled"
        @click="handleReadSlotClick"
      />
      <IconLabelButton
        :label="shelfLabel"
        icon="i-lucide-library"
        :filled="isOwned"
        @click="handleShelfClick"
      />
    </div>
  </template>

  <BookStartReadingModal
    v-model:open="showStartReadingModal"
    :work-id="workId"
    :work-title="workTitle"
    :domain="domain"
  />
  <BookFinishReadingModal
    v-model:open="showFinishReadingModal"
    :domain="domain"
    :work-id="workId"
    :work-title="workTitle"
    :initial-format="currentFormat"
    :initial-started-on="currentStartedOn"
  />
  <BookMarkReadModal
    v-model:open="showMarkReadModal"
    :work-id="workId"
    :work-title="workTitle"
    :domain="domain"
    :initial-started-on="currentStartedOn"
    :initial-format="currentFormat"
  />
  <BookMarkReadModal
    v-if="!isRelated"
    v-model:open="showReadAgainModal"
    mode="again"
    :work-id="workId"
    :work-title="workTitle"
  />
  <BookUnmarkReadModal
    v-if="!isRelated"
    v-model:open="showUnmarkReadModal"
    :work-id="workId"
    :work-title="workTitle"
  />
  <BookEditionsPickerModal
    v-if="workKey"
    v-model:open="showEditionsModal"
    :work-id="workId"
    :work-key="workKey"
    :domain="domain"
    :min-edition-year="minEditionYear"
    :max-edition-year="maxEditionYear"
  />
</template>
