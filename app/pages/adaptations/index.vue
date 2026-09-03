<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Adaptation } from "~/composables/useAdaptations";

definePageMeta({ layout: "default" });

const { fetchAdaptations } = useAdaptations();
const { data: adaptations } = await useAsyncData(
  "adaptations",
  fetchAdaptations
);

const search = ref("");

const typeOptions = computed(() => {
  const types = [
    ...new Set((adaptations.value ?? []).map((adaptation) => adaptation.type)),
  ].sort();
  return [
    { label: "All types", value: "all" },
    ...types.map((type) => ({ label: formatTypeLabel(type), value: type })),
  ];
});
const typeFilter = ref("all");

const filteredAdaptations = computed(() => {
  const term = search.value.trim().toLowerCase();

  return (adaptations.value ?? []).filter((adaptation) => {
    if (term && !adaptation.title.toLowerCase().includes(term)) return false;
    if (typeFilter.value !== "all" && adaptation.type !== typeFilter.value)
      return false;
    return true;
  });
});

const columns: TableColumn<Adaptation>[] = [
  {
    accessorKey: "title",
    header: sortableHeader<Adaptation>("Title"),
  },
  {
    accessorKey: "release_year",
    header: sortableHeader<Adaptation>("Release year"),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => formatTypeLabel(row.original.type),
  },
];
</script>

<template>
  <div>
    <UPageHeader
      title="Adaptations"
      description="Browse film and television adaptations of Stephen King's work."
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

      <UTable :data="filteredAdaptations" :columns="columns" />
    </UPageBody>
  </div>
</template>
