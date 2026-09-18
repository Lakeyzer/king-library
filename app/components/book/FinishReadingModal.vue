<script setup lang="ts">
import type { ReadFormat } from "~/composables/useBooks";

interface Props {
  workId: string;
  workTitle: string;
  /** The format captured when this work's current reading session was started (`user_books.format`), if any - prefills the field here rather than making the user re-enter what they already told us. */
  initialFormat?: ReadFormat | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialFormat: null,
});
const open = defineModel<boolean>("open", { default: false });

const { finishReading } = useBooks();

const finishedOn = ref(todayLocalDate());
const note = ref("");
const format = ref<ReadFormat | null>(props.initialFormat);
const rating = ref<number | null>(null);
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    finishedOn.value = todayLocalDate();
    note.value = "";
    format.value = props.initialFormat;
    rating.value = null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    await finishReading(props.workId, finishedOn.value, {
      note: note.value || undefined,
      format: format.value ?? undefined,
      rating: rating.value ?? undefined,
    });
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Finished Reading" :description="workTitle">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Finish date" required>
          <UInput v-model="finishedOn" type="date" />
        </UFormField>

        <BookReadDetailsFields v-model:note="note" v-model:format="format" v-model:rating="rating" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="soft" @click="close" />
      <UButton
        label="Finished"
        color="primary"
        :loading="loading"
        :disabled="!finishedOn"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
