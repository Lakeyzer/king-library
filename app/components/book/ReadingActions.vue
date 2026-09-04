<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface Props {
  workId: string;
}

const props = defineProps<Props>();

const user = useSupabaseUser();
const { userBooksByWorkId, toggleWantToRead, unmarkRead } = useBooks();

const userBook = computed(() => userBooksByWorkId.value[props.workId]);
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
  read: "Mark as Not Read",
};

const PRIMARY_ICON: Record<PrimaryState, string> = {
  neutral: "i-lucide-check-check",
  want_to_read: "i-lucide-book-open",
  currently_reading: "i-lucide-check",
  read: "i-lucide-rotate-ccw",
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

const dropdownItems = computed<DropdownMenuItem[]>(() => {
  switch (primaryState.value) {
    case "neutral":
      return [
        {
          label: "Want to Read",
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
          label: "Remove from Want to Read",
          icon: "i-lucide-bookmark-x",
          onSelect: () => toggleWantToRead(props.workId),
        },
        {
          label: "Mark as Read",
          icon: "i-lucide-check-check",
          onSelect: () => {
            showMarkReadModal.value = true;
          },
        },
      ];
    case "currently_reading":
      return [
        {
          label: "Mark as Read",
          icon: "i-lucide-check-check",
          onSelect: () => {
            showMarkReadModal.value = true;
          },
        },
      ];
    case "read":
      return [];
  }
});
</script>

<template>
  <template v-if="user">
    <UFieldGroup>
      <UButton
        :label="primaryLabel"
        :icon="primaryIcon"
        color="neutral"
        variant="subtle"
        size="xs"
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
          size="xs"
          aria-label="More reading actions"
        />
      </UDropdownMenu>
      <UButton
        v-else
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="subtle"
        size="xs"
        disabled
        aria-label="No other reading actions available"
      />
    </UFieldGroup>

    <BookStartReadingModal v-model:open="showStartReadingModal" :work-id="workId" />
    <BookFinishReadingModal v-model:open="showFinishReadingModal" :work-id="workId" />
    <BookMarkReadModal v-model:open="showMarkReadModal" :work-id="workId" />
  </template>
</template>
