<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Works",
  description:
    "Browse every Stephen King novel and collection, track what you own, and mark books as read or want-to-read.",
});

const { fetchKingWorks } = useKingWorks();
const { data: works } = await useAsyncData("works", fetchKingWorks);

const user = useSupabaseUser();

const {
  fetchUserBooks,
  fetchWorkHighlights,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation,
} = useBooks();
await useAsyncData("user-books", fetchUserBooks);
const { fetchUserEditions } = useBookshelf();
await useAsyncData("user-editions", fetchUserEditions);
const { data: workHighlights } = await useAsyncData(
  "works-page-highlights",
  fetchWorkHighlights,
);
const { data: bookRecommendation } = await useAsyncData(
  "works-page-recommendation",
  () =>
    user.value
      ? fetchUnreadRecommendation(user.value.sub)
      : Promise.resolve(null),
);
const { data: ownedUnreadRecommendation } = await useAsyncData(
  "works-page-owned-unread-recommendation",
  () =>
    user.value
      ? fetchOwnedUnreadRecommendation(user.value.sub)
      : Promise.resolve(null),
);

const readsCountLabel = (count: number) =>
  `${count} ${count === 1 ? "read" : "reads"}`;

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
    description="Browse all works by Stephen King."
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
        class="grow"
        :ui="{ fieldset: 'w-full', item: 'flex-1 justify-center' }"
      />
    </template>

    <template #item-actions="{ item }">
      <BookReadingActions
        :work-id="(item as KingWork).id"
        :work-title="(item as KingWork).title"
        :work-key="(item as KingWork).open_library_work_key"
      />
    </template>

    <template v-if="workHighlights" #sidebar>
      <WorkRecommendation :recommendation="bookRecommendation ?? null" />
      <WorkOwnedRecommendation
        :recommendation="ownedUnreadRecommendation ?? null"
      />
      <WorkLeaderboard
        title="Most Read Books"
        icon="i-lucide-trending-up"
        :items="workHighlights.mostReadBooks"
        :count-label="readsCountLabel"
        empty-message="No books have been marked read yet."
      />
      <WorkSpotlight
        title="Book of the Week"
        icon="i-lucide-sparkles"
        :work="workHighlights.bookOfTheWeek"
        empty-message="No book is featured right now."
      />
      <WorkBirthday :works="workHighlights.bookBirthdays" />
      <WorkLeastReadSpotlight :work="workHighlights.leastReadBook" />
    </template>
  </BibliographyBrowsePage>
</template>
