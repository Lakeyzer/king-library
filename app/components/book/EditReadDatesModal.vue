<script setup lang="ts">
import type { DateValue } from "reka-ui";
import { parseDate } from "@internationalized/date";
import type { ReadFormat, UserBookRead } from "~/composables/useBooks";

interface Props {
  readId: string;
  workId: string;
  workTitle: string;
  initialStartedOn?: string | null;
  initialReadOn?: string | null;
  initialReadYear?: number | null;
  initialNote?: string | null;
  initialFormat?: ReadFormat | null;
  initialRating?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialStartedOn: null,
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
function initialDateRange(): { start: DateValue | undefined; end: DateValue | undefined } {
  return {
    start: props.initialStartedOn ? parseDate(props.initialStartedOn) : undefined,
    end: props.initialReadOn ? parseDate(props.initialReadOn) : undefined,
  };
}

const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>(
  initialDateRange(),
);
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
    dateRange.value = initialDateRange();
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
      startedOn: dateRange.value.start?.toString(),
      readOn: dateRange.value.end?.toString(),
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
        <UFormField label="Reading dates" description="Optional">
          <!--
            Nuxt UI's bundled types declare two nominally distinct (but
            structurally identical) DateValue classes, so a plain v-model
            fails typecheck here even though the runtime values line up -
            cast at this one boundary rather than losing typing on dateRange
            itself, which we still rely on below.
          -->
          <UInputDate
            :model-value="(dateRange as never)"
            range
            @update:model-value="(value) => (dateRange = value as typeof dateRange)"
          />
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
      <UButton label="Cancel" color="neutral" variant="soft" @click="close" />
      <UButton label="Save" color="primary" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
