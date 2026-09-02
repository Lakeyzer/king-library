<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { KingWork } from "~/composables/useKingWorks";

definePageMeta({ layout: "default" });

const { fetchKingWorks } = useKingWorks();
const { data: works } = await useAsyncData("works", fetchKingWorks);

const search = ref("");

const bachmanFilter = ref(false);
const darkTowerFilter = ref(false);

function formatTypeLabel(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const typeOptions = computed(() => {
  const types = [
    ...new Set((works.value ?? []).map((work) => work.type)),
  ].sort();
  return [
    { label: "All types", value: "all" },
    ...types.map((type) => ({ label: formatTypeLabel(type), value: type })),
  ];
});
const typeFilter = ref("all");

const filteredWorks = computed(() => {
  const term = search.value.trim().toLowerCase();

  return (works.value ?? []).filter((work) => {
    if (term && !work.title.toLowerCase().includes(term)) return false;
    if (bachmanFilter.value && !work.bachman) return false;
    if (darkTowerFilter.value && !work.dark_tower) return false;
    if (typeFilter.value !== "all" && work.type !== typeFilter.value)
      return false;
    return true;
  });
});

const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");

function flagIndicator(value: boolean) {
  return h(UCheckbox, {
    modelValue: value,
    disabled: true,
  });
}

function sortableHeader(label: string): TableColumn<KingWork>["header"] {
  return ({ column }) => {
    const isSorted = column.getIsSorted();

    return h(UButton, {
      color: "neutral",
      variant: "ghost",
      label,
      icon:
        isSorted === "asc"
          ? "i-lucide-arrow-up"
          : isSorted === "desc"
            ? "i-lucide-arrow-down"
            : "i-lucide-arrow-up-down",
      onClick: () => column.toggleSorting(isSorted === "asc"),
    });
  };
}

const columns: TableColumn<KingWork>[] = [
  {
    accessorKey: "title",
    header: sortableHeader("Title"),
  },
  {
    accessorKey: "original_publish_year",
    header: sortableHeader("Release year"),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => formatTypeLabel(row.original.type),
  },
  {
    accessorKey: "bachman",
    header: "Bachman",
    cell: ({ row }) => flagIndicator(row.original.bachman),
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
      title="Works"
      description="Browse the canonical Stephen King bibliography."
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
        <UCheckbox v-model="bachmanFilter" label="Bachman" />
        <UCheckbox v-model="darkTowerFilter" label="Dark Tower" />
      </div>

      <UTable :data="filteredWorks" :columns="columns" />
    </UPageBody>
  </div>
</template>
