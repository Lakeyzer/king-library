<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface Props {
  workId: string;
  /** Open Library work key, needed to open the Add to Shelf editions picker - when absent, no Add to Shelf control is shown. */
  workKey?: string | null;
  mode?: "compact" | "expanded";
}

const props = withDefaults(defineProps<Props>(), {
  workKey: null,
  mode: "compact",
});

const user = useSupabaseUser();
const { userBooksByWorkId, toggleWantToRead, unmarkRead } = useBooks();

const showEditionsModal = ref(false);

const userBook = computed(() => userBooksByWorkId.value[props.workId]);
const isOwned = computed(() => userBook.value?.owned ?? false);
const isWantToRead = computed(() => userBook.value?.want_to_read ?? false);
const isCurrentlyReading = computed(
  () => userBook.value?.currently_reading ?? false,
);
const isRead = computed(() => userBook.value?.read ?? false);

type PrimaryState = "neutral" | "want_to_read" | "currently_reading" | "read";

const primaryState = computed<PrimaryState>(() => {
  if (isRead.value) return "read";
  if (isCurrentlyReading.value) return "currently_reading";
  if (isWantToRead.value) return "want_to_read";
  return "neutral";
});

const showStartReadingModal = ref(false);
const showFinishReadingModal = ref(false);
const showMarkReadModal = ref(false);

const PRIMARY_LABEL: Record<PrimaryState, string> = {
  neutral: "Mark as Read",
  want_to_read: "Start Reading",
  currently_reading: "Finish",
  read: "Mark as Unread",
};

const PRIMARY_ICON: Record<PrimaryState, string> = {
  neutral: "i-lucide-circle-check",
  want_to_read: "i-lucide-book-open",
  currently_reading: "i-lucide-book-open",
  read: "i-lucide-circle-check",
};

const primaryLabel = computed(() => PRIMARY_LABEL[primaryState.value]);
const primaryIcon = computed(() => PRIMARY_ICON[primaryState.value]);

function handlePrimaryClick() {
  switch (primaryState.value) {
    case "neutral":
      showMarkReadModal.value = true;
      break;
    case "want_to_read":
      showStartReadingModal.value = true;
      break;
    case "currently_reading":
      showFinishReadingModal.value = true;
      break;
    case "read":
      unmarkRead(props.workId);
      break;
  }
}

const readingDropdownItems = computed<DropdownMenuItem[]>(() => {
  switch (primaryState.value) {
    case "neutral":
      return [
        {
          label: "Add to Readlist",
          icon: "i-lucide-bookmark",
          onSelect: () => toggleWantToRead(props.workId),
        },
        {
          label: "Start Reading",
          icon: "i-lucide-book-open",
          onSelect: () => {
            showStartReadingModal.value = true;
          },
        },
      ];
    case "want_to_read":
      return [
        {
          label: "Remove from Readlist",
          icon: "i-lucide-bookmark-x",
          onSelect: () => toggleWantToRead(props.workId),
        },
        {
          label: "Mark as Read",
          icon: "i-lucide-circle-check",
          onSelect: () => {
            showMarkReadModal.value = true;
          },
        },
      ];
    case "currently_reading":
      return [
        {
          label: "Mark as Read",
          icon: "i-lucide-circle-check",
          onSelect: () => {
            showMarkReadModal.value = true;
          },
        },
      ];
    case "read":
      return [];
  }
});

// Owning a work is independent of reading status, so Add to Shelf is
// available in every state - appended here rather than duplicated in each
// readingDropdownItems branch above.
const dropdownItems = computed<DropdownMenuItem[]>(() => {
  if (!props.workKey) return readingDropdownItems.value;

  return [
    ...readingDropdownItems.value,
    {
      label: shelfLabel.value,
      icon: "i-lucide-library",
      onSelect: () => {
        showEditionsModal.value = true;
      },
    },
  ];
});

// Expanded mode shows every action always, disabling whichever don't apply
// to the current state, rather than hiding them (see reading-status spec).
const canToggleReadlistOrStart = computed(
  () =>
    primaryState.value === "neutral" || primaryState.value === "want_to_read",
);

const canStartOrFinishReading = computed(() => primaryState.value !== "read");

const readlistLabel = computed(() =>
  isWantToRead.value ? "Remove from Readlist" : "Add to Readlist",
);

const readLabel = computed(() =>
  isRead.value ? "Mark as Unread" : "Mark as Read",
);

const startFinishLabel = computed(() =>
  isCurrentlyReading.value ? "Finish Reading" : "Start Reading",
);

const shelfLabel = computed(() =>
  isOwned.value ? "On Shelf" : "Add to Shelf",
);

function handleReadlistToggle() {
  toggleWantToRead(props.workId);
}

function handleStartOrFinishReading() {
  if (isCurrentlyReading.value) {
    showFinishReadingModal.value = true;
  } else {
    showStartReadingModal.value = true;
  }
}

function handleReadToggle() {
  if (isRead.value) {
    unmarkRead(props.workId);
  } else {
    showMarkReadModal.value = true;
  }
}
</script>

<template>
  <template v-if="user">
    <UFieldGroup v-if="mode === 'compact'">
      <UButton
        :label="primaryLabel"
        :icon="primaryIcon"
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
          aria-label="More reading actions"
        />
      </UDropdownMenu>
      <UButton
        v-else
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="subtle"
        disabled
        aria-label="No other reading actions available"
      />
    </UFieldGroup>

    <template v-else>
      <UFieldGroup class="hidden max-sm:flex max-sm:w-full">
        <IconLabelButton
          stacked
          class="flex-1"
          :label="readlistLabel"
          icon="i-lucide-bookmark"
          :filled="isWantToRead"
          :disabled="!canToggleReadlistOrStart"
          @click="handleReadlistToggle"
        />
        <IconLabelButton
          stacked
          class="flex-1"
          :label="startFinishLabel"
          icon="i-lucide-book-open"
          :filled="isCurrentlyReading"
          :disabled="!canStartOrFinishReading"
          @click="handleStartOrFinishReading"
        />
        <IconLabelButton
          stacked
          class="flex-1"
          :label="readLabel"
          icon="i-lucide-circle-check"
          :filled="isRead"
          @click="handleReadToggle"
        />
        <IconLabelButton
          v-if="workKey"
          stacked
          class="flex-1"
          :label="shelfLabel"
          icon="i-lucide-library"
          :filled="isOwned"
          @click="showEditionsModal = true"
        />
      </UFieldGroup>

      <div class="hidden flex-nowrap gap-2 sm:flex">
        <IconLabelButton
          :label="readlistLabel"
          icon="i-lucide-bookmark"
          :filled="isWantToRead"
          :disabled="!canToggleReadlistOrStart"
          @click="handleReadlistToggle"
        />
        <IconLabelButton
          :label="startFinishLabel"
          icon="i-lucide-book-open"
          :filled="isCurrentlyReading"
          :disabled="!canStartOrFinishReading"
          @click="handleStartOrFinishReading"
        />
        <IconLabelButton
          :label="readLabel"
          icon="i-lucide-circle-check"
          :filled="isRead"
          @click="handleReadToggle"
        />
        <IconLabelButton
          v-if="workKey"
          :label="shelfLabel"
          icon="i-lucide-library"
          :filled="isOwned"
          @click="showEditionsModal = true"
        />
      </div>
    </template>

    <BookStartReadingModal
      v-model:open="showStartReadingModal"
      :work-id="workId"
    />
    <BookFinishReadingModal
      v-model:open="showFinishReadingModal"
      :work-id="workId"
    />
    <BookMarkReadModal v-model:open="showMarkReadModal" :work-id="workId" />
    <BookEditionsPickerModal
      v-if="workKey"
      v-model:open="showEditionsModal"
      :work-id="workId"
      :work-key="workKey"
    />
  </template>
</template>
