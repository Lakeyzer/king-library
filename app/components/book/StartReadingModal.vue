<script setup lang="ts">
interface Props {
  workId: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { startReading } = useBooks();

const startedOn = ref(todayLocalDate());
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) startedOn.value = todayLocalDate();
});

async function confirm() {
  loading.value = true;
  try {
    await startReading(props.workId, startedOn.value);
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Start Reading">
    <template #body>
      <UFormField label="Start date" required>
        <UInput v-model="startedOn" type="date" />
      </UFormField>
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
