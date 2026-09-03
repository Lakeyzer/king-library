<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { KingShortStory } from "~/composables/useShortStories";

definePageMeta({ layout: "default" });

const { fetchShortStories } = useShortStories();
const { data: shortStories } = await useAsyncData(
  "short-stories",
  fetchShortStories
);

const search = ref("");

const typeOptions = computed(() => {
  const types = [
    ...new Set((shortStories.value ?? []).map((story) => story.type)),
  ].sort();
  return [
    { label: "All types", value: "all" },
    ...types.map((type) => ({ label: formatTypeLabel(type), value: type })),
  ];
});
const typeFilter = ref("all");

const filteredShortStories = computed(() => {
  const term = search.value.trim().toLowerCase();

  return (shortStories.value ?? []).filter((story) => {
    if (term && !story.title.toLowerCase().includes(term)) return false;
    if (typeFilter.value !== "all" && story.type !== typeFilter.value)
      return false;
    return true;
  });
});

const columns: TableColumn<KingShortStory>[] = [
  {
    accessorKey: "title",
    header: sortableHeader<KingShortStory>("Title"),
  },
  {
    accessorKey: "original_publish_year",
    header: sortableHeader<KingShortStory>("Original publish year"),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => formatTypeLabel(row.original.type),
  },
  {
    accessorKey: "dark_tower",
    header: "Dark Tower",
    cell: ({ row }) => flagIndicator(row.original.dark_tower),
  },
];
</script>

<template>
  <div>
    <UPageHeader
      title="Short Stories"
      description="Browse Stephen King's short stories and novellas."
    />

    <UPageBody>
      <div class="flex flex-wrap items-end gap-4 mb-4">
        <UFormField label="Search">
          <UInput
            v-model="search"
            placeholder="Search by title"
            icon="i-lucide-search"
          />
        </UFormField>
        <UFormField label="Type">
          <USelect v-model="typeFilter" :items="typeOptions" class="w-48" />
        </UFormField>
      </div>

      <UTable :data="filteredShortStories" :columns="columns" />
    </UPageBody>
  </div>
</template>
