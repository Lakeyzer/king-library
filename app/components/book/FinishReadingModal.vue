<script setup lang="ts">
interface Props {
  workId: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { finishReading } = useBooks();

const finishedOn = ref(todayLocalDate());
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) finishedOn.value = todayLocalDate();
});

async function confirm() {
  loading.value = true;
  try {
    await finishReading(props.workId, finishedOn.value);
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Finished Reading">
    <template #body>
      <UFormField label="Finish date" required>
        <UInput v-model="finishedOn" type="date" />
      </UFormField>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton
        label="Finished"
        :loading="loading"
        :disabled="!finishedOn"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
