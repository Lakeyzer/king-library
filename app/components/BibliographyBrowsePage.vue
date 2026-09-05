<script
  setup
  lang="ts"
  generic="T extends { id: string; title: string; type: string; slug?: string }"
>
const props = defineProps<{
  title: string;
  description: string;
  items: T[];
  yearOf: (item: T) => number | null;
  sortValueOf?: (item: T) => number | null;
  imageSrcOf: (item: T) => string | null;
  imageAltOf: (item: T) => string;
  placeholderIcon: string;
  sortYearLabel: string;
  extraFilter?: (item: T) => boolean;
  detailPathPrefix?: string;
}>();

const search = ref("");
const typeFilter = ref("all");

const typeOptions = computed(() => {
  const types = [...new Set(props.items.map((item) => item.type))].sort();
  return [
    { label: "All types", value: "all" },
    ...types.map((type) => ({ label: formatTypeLabel(type), value: type })),
  ];
});

const sortOptions = computed(() => [
  { label: "Title", value: "title" },
  { label: props.sortYearLabel, value: "year" },
]);
const sortBy = ref<"title" | "year">("year");
const sortDir = ref<"asc" | "desc">("asc");

function toggleSortDir() {
  sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
}

// Nullable years always sort to the end, in either direction.
function compareYear(a: number | null, b: number | null, dir: "asc" | "desc") {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === "asc" ? a - b : b - a;
}

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();

  const filtered = props.items.filter((item) => {
    if (term && !item.title.toLowerCase().includes(term)) return false;
    if (typeFilter.value !== "all" && item.type !== typeFilter.value)
      return false;
    if (props.extraFilter && !props.extraFilter(item)) return false;
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sortBy.value === "title") {
      const cmp = a.title.localeCompare(b.title);
      return sortDir.value === "asc" ? cmp : -cmp;
    }
    const valueOf = props.sortValueOf ?? props.yearOf;
    return compareYear(valueOf(a), valueOf(b), sortDir.value);
  });
  return sorted;
});
</script>

<template>
  <div>
    <UPageHeader :title="title" :description="description" />

    <UPageBody>
      <div class="flex flex-wrap items-end gap-4 mb-4">
        <UFormField>
          <UInput
            v-model="search"
            placeholder="Search by title"
            icon="i-lucide-search"
          />
        </UFormField>
        <UFormField>
          <USelect
            v-model="typeFilter"
            icon="i-lucide-filter"
            :items="typeOptions"
            class="w-48"
          />
        </UFormField>
        <UFormField>
          <div class="flex items-center gap-1">
            <USelect
              v-if="sortOptions.length > 1"
              v-model="sortBy"
              :items="sortOptions"
              icon="i-lucide-arrow-up-down"
              class="w-44"
              aria-label="Sort field"
            />
            <UButton
              color="neutral"
              variant="subtle"
              :icon="
                sortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
              "
              aria-label="Toggle sort direction"
              @click="toggleSortDir"
            />
          </div>
        </UFormField>
        <slot name="extra-filters" />
      </div>

      <ul class="flex flex-col gap-2">
        <BibliographyListItem
          v-for="item in filteredItems"
          :key="item.id"
          :src="imageSrcOf(item)"
          :image-alt="imageAltOf(item)"
          :placeholder-icon="placeholderIcon"
          :title="item.title"
          :release-year="yearOf(item)"
          :type-label="formatTypeLabel(item.type)"
          :to="detailPathPrefix && item.slug ? `${detailPathPrefix}/${item.slug}` : undefined"
        >
          <template #actions>
            <slot name="item-actions" :item="item" />
          </template>
        </BibliographyListItem>
      </ul>
    </UPageBody>
  </div>
</template>
