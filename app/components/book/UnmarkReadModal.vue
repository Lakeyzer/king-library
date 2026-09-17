<script setup lang="ts">
interface Props {
  workId: string;
  workTitle: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { unmarkRead } = useBooks();
const { fetchUserShortStoryReads } = useShortStories();

const loading = ref(false);

// Un-marking a work read un-cascades any short story reads it cascaded (see
// supabase-conventions "uncascade_short_story_reads_on_collection_unread") -
// refetch so reading-status controls on screen pick that up, same as
// ReadingActions.vue did before this confirmation step existed.
async function confirm() {
  loading.value = true;
  try {
    await unmarkRead(props.workId);
    await fetchUserShortStoryReads();
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Mark as unread?" :description="workTitle">
    <template #body>
      <p class="text-sm text-muted">
        This permanently deletes every read you've logged for
        <strong class="text-highlighted"><NumberMotif :text="workTitle" /></strong>, including any notes,
        formats, and ratings you've recorded. This cannot be undone.
      </p>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton label="Mark as Unread" color="error" :loading="loading" @click="confirm" />
    </template>
  </UModal>
</template>
