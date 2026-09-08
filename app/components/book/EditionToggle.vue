<script setup lang="ts">
interface Props {
  workId: string;
  editionId: string;
  editionTitle: string;
}

const props = defineProps<Props>();

const user = useSupabaseUser();
const { isEditionAdded, addEdition, removeEdition } = useBookshelf();

const added = computed(() => isEditionAdded(props.workId, props.editionId));
const pending = ref(false);

async function toggle() {
  if (pending.value) return;

  pending.value = true;
  try {
    if (added.value) {
      await removeEdition(props.workId, props.editionId);
    } else {
      await addEdition(props.workId, { key: props.editionId, title: props.editionTitle });
    }
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <UButton
    v-if="user"
    :icon="added ? 'i-lucide-check' : 'i-lucide-plus'"
    :color="added ? 'success' : 'neutral'"
    :variant="added ? 'solid' : 'soft'"
    size="xs"
    :loading="pending"
    class="shrink-0 rounded-full"
    :aria-label="added ? `Remove ${editionTitle} from your shelf` : `Add ${editionTitle} to your shelf`"
    @click="toggle"
  />
</template>
