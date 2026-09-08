<script setup lang="ts">
interface Props {
  workId: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { markRead } = useBooks();

const startedOn = ref("");
const finishedOn = ref("");
const readYear = ref<number | null>(null);
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    startedOn.value = "";
    finishedOn.value = "";
    readYear.value = null;
  }
});

async function confirm() {
  loading.value = true;
  try {
    await markRead(props.workId, {
      startedOn: startedOn.value || undefined,
      finishedOn: finishedOn.value || undefined,
      readYear: readYear.value ?? undefined,
    });
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Mark as Read">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Start date" description="Optional">
          <UInput v-model="startedOn" type="date" />
        </UFormField>
        <UFormField label="Finish date" description="Optional">
          <UInput v-model="finishedOn" type="date" />
        </UFormField>
        <UFormField
          label="Year read"
          description="Optional — use if you don't remember exact dates"
        >
          <UInputNumber
            v-model="readYear"
            :min="1900"
            :max="new Date().getFullYear()"
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
