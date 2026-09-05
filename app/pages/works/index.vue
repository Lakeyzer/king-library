<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

definePageMeta({ layout: "default" });

const { fetchKingWorks } = useKingWorks();
const { data: works } = await useAsyncData("works", fetchKingWorks);

const { fetchUserBooks } = useBooks();
await useAsyncData("user-books", fetchUserBooks);

const flagOptions = [
  { label: "All", value: "all" },
  { label: "Bachman", value: "bachman" },
  { label: "Dark Tower", value: "darkTower" },
];
const flagFilter = ref<"all" | "bachman" | "darkTower">("all");

function extraFilter(work: KingWork) {
  if (flagFilter.value === "bachman") return work.bachman;
  if (flagFilter.value === "darkTower") return work.dark_tower;
  return true;
}
</script>

<template>
  <BibliographyBrowsePage
    title="Works"
    description="Browse the canonical Stephen King bibliography."
    detail-path-prefix="/works"
    :items="works ?? []"
    :year-of="(work: KingWork) => Number(work.publish_date.slice(0, 4))"
    :sort-value-of="(work: KingWork) => Date.parse(work.publish_date)"
    :image-src-of="
      (work: KingWork) =>
        work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'M') : null
    "
    :image-alt-of="(work: KingWork) => `${work.title} cover`"
    placeholder-icon="i-lucide-book"
    sort-year-label="Release year"
    :extra-filter="extraFilter"
  >
    <template #extra-filters>
      <URadioGroup
        v-model="flagFilter"
        :items="flagOptions"
        orientation="horizontal"
        variant="table"
        indicator="hidden"
        size="sm"
      />
    </template>

    <template #item-actions="{ item }">
      <BookReadingActions :work-id="(item as KingWork).id" />
    </template>
  </BibliographyBrowsePage>
</template>
