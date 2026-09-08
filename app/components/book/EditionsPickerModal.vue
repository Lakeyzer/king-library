<script setup lang="ts">
interface Props {
  workId: string;
  workKey: string;
}

const props = defineProps<Props>();
const open = defineModel<boolean>("open", { default: false });

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
      <WorkEditionList :work-key="workKey" :work-id="workId" orientation="vertical" />
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
