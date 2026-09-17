<script setup lang="ts">
import type { ReadFormat, UserBookRead } from "~/composables/useBooks";

interface Props {
  readId: string;
  workId: string;
  workTitle: string;
  initialReadOn?: string | null;
  initialReadYear?: number | null;
  initialNote?: string | null;
  initialFormat?: ReadFormat | null;
  initialRating?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialReadOn: null,
  initialReadYear: null,
  initialNote: null,
  initialFormat: null,
  initialRating: null,
});
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [UserBookRead] }>();

const { updateLoggedRead } = useBooks();

// Initialized from props directly, not just inside the watch below - the
// parent sets its "editing" state and flips `open` to true in the same
// tick (see ProfileReadingTimeline's openEditDatesModal), so this modal's
// very first mount already has open=true, and a watch(open, ...) without
// `immediate: true` never fires for a value that was already true when the
// watcher was created.
const readOn = ref(props.initialReadOn ?? "");
const readYear = ref<number | null>(props.initialReadYear ?? null);
const note = ref(props.initialNote ?? "");
const format = ref<ReadFormat | null>(props.initialFormat ?? null);
const rating = ref<number | null>(props.initialRating ?? null);
const loading = ref(false);

// Still needed for the case where this same instance stays mounted and is
// reopened for a different entry (editingEntry changes, then the pencil is
// clicked again) - that's a real false-to-true transition, which this
// watch does catch.
watch(open, (isOpen) => {
  if (isOpen) {
    readOn.value = props.initialReadOn ?? "";
    readYear.value = props.initialReadYear ?? null;
    note.value = props.initialNote ?? "";
    format.value = props.initialFormat ?? null;
    rating.value = props.initialRating ?? null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    const row = await updateLoggedRead(props.readId, props.workId, {
      readOn: readOn.value || undefined,
      readYear: readYear.value ?? undefined,
      note: note.value || undefined,
      format: format.value ?? undefined,
      rating: rating.value ?? undefined,
    });
    emit("saved", row);
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Edit Logged Read" :description="workTitle">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Read on" description="Optional">
          <UInput v-model="readOn" type="date" />
        </UFormField>
        <UFormField
          label="Year read"
          description="Optional — use if you don't remember the exact date"
        >
          <UInputNumber
            v-model="readYear"
            :min="1900"
            :max="new Date().getFullYear()"
            :format-options="{ useGrouping: false }"
          />
        </UFormField>

        <BookReadDetailsFields v-model:note="note" v-model:format="format" v-model:rating="rating" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton label="Save" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
