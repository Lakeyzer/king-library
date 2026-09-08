<script setup lang="ts">
import type { BookshelfItem } from "~/composables/useBookshelf";

interface Props {
  item: BookshelfItem;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ removed: [] }>();

const { removeEdition } = useBookshelf();
const { setOwned } = useBooks();

const removing = ref(false);

async function confirmRemove() {
  removing.value = true;
  try {
    if (props.item.kind === "edition") {
      await removeEdition(props.item.workId, props.item.editionId);
    } else {
      await setOwned(props.item.workId, false);
    }
    open.value = false;
    emit("removed");
  } finally {
    removing.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Remove from Shelf">
    <template #body>
      <p class="text-sm text-muted">
        Remove <strong class="text-highlighted">{{ item.workTitle }}</strong> from your shelf?
      </p>
      <p class="mt-1 text-xs text-muted">
        <template v-if="item.kind === 'edition'">
          If this is the last edition you have of it, the work will no longer be marked owned.
        </template>
        <template v-else> This work will no longer be marked owned. </template>
      </p>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
      <UButton label="Remove" color="error" :loading="removing" @click="confirmRemove" />
    </template>
  </UModal>
</template>
