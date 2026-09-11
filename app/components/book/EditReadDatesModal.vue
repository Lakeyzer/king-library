<script setup lang="ts">
import type { DateValue } from "reka-ui";
import { parseDate } from "@internationalized/date";
import type { UserBook } from "~/composables/useBooks";

interface Props {
  workId: string;
  workTitle: string;
  initialStartedOn?: string | null;
  initialFinishedOn?: string | null;
  initialReadYear?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialStartedOn: null,
  initialFinishedOn: null,
  initialReadYear: null,
});
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [UserBook] }>();

const { markRead } = useBooks();

// Initialized from props directly, not just inside the watch below - the
// parent sets its "editing" state and flips `open` to true in the same
// tick (see ProfileReadingTimeline's openEditDatesModal), so this modal's
// very first mount already has open=true, and a watch(open, ...) without
// `immediate: true` never fires for a value that was already true when the
// watcher was created.
function initialDateRange(): { start: DateValue | undefined; end: DateValue | undefined } {
  return {
    start: props.initialStartedOn ? parseDate(props.initialStartedOn) : undefined,
    end: props.initialFinishedOn ? parseDate(props.initialFinishedOn) : undefined,
  };
}

const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>(
  initialDateRange(),
);
const readYear = ref<number | null>(props.initialReadYear ?? null);
const loading = ref(false);

// Still needed for the case where this same instance stays mounted and is
// reopened for a different entry (editingEntry changes, then the pencil is
// clicked again) - that's a real false-to-true transition, which this
// watch does catch.
watch(open, (isOpen) => {
  if (isOpen) {
    dateRange.value = initialDateRange();
    readYear.value = props.initialReadYear ?? null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    const row = await markRead(props.workId, {
      startedOn: dateRange.value.start?.toString(),
      finishedOn: dateRange.value.end?.toString(),
      readYear: readYear.value ?? undefined,
    });
    emit("saved", row);
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Edit Reading Dates" :description="workTitle">
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
          description="Optional — use if you don't remember exact dates"
        >
          <UInputNumber
            v-model="readYear"
            :min="1900"
            :max="new Date().getFullYear()"
            :format-options="{ useGrouping: false }"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton label="Save" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
