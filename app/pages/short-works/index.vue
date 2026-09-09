<script setup lang="ts">
import type { KingShortStory } from "~/composables/useShortStories";

definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Short Works",
  description:
    "Browse Stephen King's short stories and novellas, see which collections they appear in, and track which ones you've read.",
});

const { fetchShortStories, fetchCollectionsOverview } = useShortStories();
const { data: shortStories } = await useAsyncData(
  "short-stories",
  fetchShortStories,
);
const { data: collectionsOverview } = await useAsyncData(
  "short-stories-collections-overview",
  fetchCollectionsOverview,
);

const notInCollectionOnly = ref(false);

const storyIdsInCollection = computed(
  () => new Set(collectionsOverview.value?.storyIdsInCollection ?? []),
);

function extraFilter(story: KingShortStory) {
  if (notInCollectionOnly.value && storyIdsInCollection.value.has(story.id)) {
    return false;
  }
  return true;
}
</script>

<template>
  <BibliographyBrowsePage
    title="Short Works"
    description="Browse Stephen King's short stories and novellas."
    detail-path-prefix="/short-works"
    :items="shortStories ?? []"
    :year-of="(story: KingShortStory) => story.original_publish_year"
    :image-src-of="() => null"
    :image-alt-of="(story: KingShortStory) => `${story.title} placeholder`"
    placeholder-icon="i-lucide-book-open"
    sort-year-label="Original publish year"
    :extra-filter="extraFilter"
  >
    <template #extra-filters>
      <UCheckbox v-model="notInCollectionOnly" label="Not in a collection" />
    </template>

    <template v-if="collectionsOverview" #sidebar>
      <ShortStoryCollectionsOverview
        :collections="collectionsOverview.collections"
        :coverage-percent="collectionsOverview.coveragePercent"
      />
    </template>
  </BibliographyBrowsePage>
</template>
