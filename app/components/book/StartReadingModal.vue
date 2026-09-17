<script setup lang="ts">
import type { ReadFormat } from "~/composables/useBooks";

interface Props {
  workId: string;
  workTitle: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { startReading } = useBooks();

const startedOn = ref(todayLocalDate());
const format = ref<ReadFormat | null>(null);
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    startedOn.value = todayLocalDate();
    format.value = null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    await startReading(props.workId, startedOn.value, format.value ?? undefined);
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Start Reading" :description="workTitle">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Start date" required>
          <UInput v-model="startedOn" type="date" />
        </UFormField>

        <UFormField label="Format" description="Optional">
          <USelect
            :model-value="format ?? undefined"
            :items="READ_FORMAT_OPTIONS"
            placeholder="Select format"
            class="w-48"
            @update:model-value="(value) => (format = (value as ReadFormat | undefined) ?? null)"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton
        label="Start Reading"
        :loading="loading"
        :disabled="!startedOn"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
