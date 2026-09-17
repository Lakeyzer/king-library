<script setup lang="ts">
import type { DateValue } from "reka-ui";
import type { ReadFormat } from "~/composables/useBooks";

interface Props {
  workId: string;
  workTitle: string;
  /** "again" reuses this same prompt for reading-status's "read again" action on a work already marked read - see design.md "Read-again reuses the mark-read-directly prompt". */
  mode?: "mark" | "again";
}

const props = withDefaults(defineProps<Props>(), {
  mode: "mark",
});
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ logged: [] }>();

const { markRead, readAgain } = useBooks();
const { fetchUserShortStoryReads } = useShortStories();

const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>({
  start: undefined,
  end: undefined,
});
const readYear = ref<number | null>(null);
const note = ref("");
const format = ref<ReadFormat | null>(null);
const rating = ref<number | null>(null);
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    dateRange.value = { start: undefined, end: undefined };
    readYear.value = null;
    note.value = "";
    format.value = null;
    rating.value = null;
  }
});

const title = computed(() => (props.mode === "again" ? "Read Again" : "Mark as Read"));
const confirmLabel = computed(() => (props.mode === "again" ? "Log Read" : "Mark as Read"));

async function confirm() {
  loading.value = true;
  try {
    const details = {
      startedOn: dateRange.value.start?.toString(),
      finishedOn: dateRange.value.end?.toString(),
      readYear: readYear.value ?? undefined,
      note: note.value || undefined,
      format: format.value ?? undefined,
      rating: rating.value ?? undefined,
    };

    if (props.mode === "again") {
      await readAgain(props.workId, details);
    } else {
      await markRead(props.workId, details);
      // Marking a collection read cascades to user_short_story_reads via a DB
      // trigger (see supabase-conventions "cascade_short_story_reads_on_collection_read") -
      // refetch so any short story reading-status controls on screen pick up
      // the newly-created rows instead of still showing unread. Only relevant
      // the first time a work becomes read, not on a "read again" of a work
      // that's already read (the cascade already ran).
      await fetchUserShortStoryReads();
    }
    open.value = false;
    emit("logged");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="workTitle">
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

        <BookReadDetailsFields v-model:note="note" v-model:format="format" v-model:rating="rating" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton :label="confirmLabel" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
