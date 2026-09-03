<script setup lang="ts">
import type { KingShortStory } from "~/composables/useShortStories";

definePageMeta({ layout: "default" });

const { fetchShortStories } = useShortStories();
const { data: shortStories } = await useAsyncData(
  "short-stories",
  fetchShortStories,
);
</script>

<template>
  <BibliographyBrowsePage
    title="Short Stories"
    description="Browse Stephen King's short stories and novellas."
    :items="shortStories ?? []"
    :year-of="(story: KingShortStory) => story.original_publish_year"
    :image-src-of="() => null"
    :image-alt-of="(story: KingShortStory) => `${story.title} placeholder`"
    placeholder-icon="i-lucide-book-open"
    sort-year-label="Original publish year"
  />
</template>
