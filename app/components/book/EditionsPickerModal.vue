<script setup lang="ts">
interface Props {
  workId: string;
  workKey: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

const { userBooksByWorkId, setOwned } = useBooks();
const { userEditionsByWorkId } = useBookshelf();

const isOwned = computed(() => userBooksByWorkId.value[props.workId]?.owned ?? false);
// Ownership becomes edition-driven the moment any edition is added (see
// useBookshelf's addEdition/removeEdition) - this generic toggle only makes
// sense while there's no edition to hang ownership off instead, otherwise
// unchecking it here would desync owned=false from still-present edition rows.
const hasEditions = computed(() => (userEditionsByWorkId.value[props.workId]?.size ?? 0) > 0);

function handleOwnedToggle(value: boolean | "indeterminate") {
  setOwned(props.workId, value === true);
}

// Deep-links straight into Open Library's add-edition form for this work,
// rather than just its editions listing. See design.md "Open Library 'add a
// missing edition' link target".
const openLibraryAddEditionUrl = computed(
  () => `https://openlibrary.org/books/add?work=/works/${props.workKey}`,
);
</script>

<template>
  <UModal v-model:open="open" title="Add to Shelf">
    <template #body>
      <div class="flex flex-col gap-4">
        <UCheckbox
          v-if="!hasEditions"
          :model-value="isOwned"
          label="On my shelf"
          description="Just mark it owned, without picking a specific edition"
          @update:model-value="handleOwnedToggle"
        />

        <WorkEditionList :work-key="workKey" :work-id="workId" orientation="vertical" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Can't find your edition? Add it on Open Library"
        icon="i-lucide-external-link"
        color="neutral"
        variant="ghost"
        :to="openLibraryAddEditionUrl"
        target="_blank"
        rel="noopener noreferrer"
      />
      <UButton label="Done" color="neutral" variant="subtle" @click="close" />
    </template>
  </UModal>
</template>
