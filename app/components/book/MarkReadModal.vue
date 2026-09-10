<script setup lang="ts">
import type { DateValue } from "reka-ui";

interface Props {
  workId: string;
  workTitle: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { markRead } = useBooks();

const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>({
  start: undefined,
  end: undefined,
});
const readYear = ref<number | null>(null);
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    dateRange.value = { start: undefined, end: undefined };
    readYear.value = null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    await markRead(props.workId, {
      startedOn: dateRange.value.start?.toString(),
      finishedOn: dateRange.value.end?.toString(),
      readYear: readYear.value ?? undefined,
    });
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Mark as Read" :description="workTitle">
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
      <UButton label="Mark as Read" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
