<script setup lang="ts">
import type { ConnectionListItem } from "~/components/detail/ConnectionList.vue";

definePageMeta({ layout: false });

const route = useRoute();
const slug = route.params.slug as string;

const { fetchShortStoryBySlug, fetchCollectionsForShortStory } = useShortStories();
const { data: storyData } = await useAsyncData(`short-story-${slug}`, () =>
  fetchShortStoryBySlug(slug),
);

if (!storyData.value) {
  throw createError({ statusCode: 404, statusMessage: "Short story not found" });
}

const story = storyData.value;

const { data: collections } = await useAsyncData(`short-story-${slug}-collections`, () =>
  fetchCollectionsForShortStory(story.id),
);

const { fetchAdaptationsForShortStory } = useAdaptations();
const { data: adaptations } = await useAsyncData(`short-story-${slug}-adaptations`, () =>
  fetchAdaptationsForShortStory(story.id),
);

// Use the earliest collection's cover as a stand-in - short stories have no cover of their own.
const coverSrc = computed(() => {
  const cover = collections.value?.[0]?.cover_id;
  return cover ? getOpenLibraryCoverUrl(cover, "L") : null;
});

const collectionItems = computed<ConnectionListItem[]>(() =>
  (collections.value ?? []).map((collection) => ({
    id: collection.id,
    title: collection.title,
    imageSrc: collection.cover_id ? getOpenLibraryCoverUrl(collection.cover_id, "M") : null,
    imageAlt: `${collection.title} cover`,
    year: Number(collection.publish_date.slice(0, 4)),
    to: `/works/${collection.slug}`,
  })),
);

const adaptationItems = computed<ConnectionListItem[]>(() =>
  (adaptations.value ?? []).map((adaptation) => ({
    id: adaptation.id,
    title: adaptation.title,
    imageSrc: adaptation.tmdb_poster_path
      ? getTmdbPosterUrl(adaptation.tmdb_poster_path, "w154")
      : null,
    imageAlt: `${adaptation.title} poster`,
    year: adaptation.release_year,
    typeLabel: formatTypeLabel(adaptation.type),
    to: `/adaptations/${adaptation.slug}`,
  })),
);

useSeoMeta({ title: story.title });
</script>

<template>
  <NuxtLayout name="detail">
    <template #hero>
      <DetailHero
        :image-src="coverSrc"
        :image-alt="`${story.title} cover`"
        image-placeholder-icon="i-lucide-book-open"
      >
        <div>
          <h1 class="text-3xl font-bold text-pretty text-highlighted sm:text-4xl">
            {{ story.title }}
          </h1>
          <p class="mt-4 flex items-center gap-4 text-muted">
            <span v-if="story.original_publish_year">{{ story.original_publish_year }}</span>
            <span>{{ formatTypeLabel(story.type) }}</span>
          </p>
          <p v-if="story.first_published_in" class="mt-1 text-sm text-muted">
            First published in {{ story.first_published_in }}
          </p>
        </div>

        <div v-if="story.dark_tower" class="flex flex-wrap items-center gap-2">
          <UBadge
            color="primary"
            variant="subtle"
            icon="i-lucide-tornado"
            label="Dark Tower"
          />
        </div>

        <p v-if="story.dark_tower_relation" class="text-sm text-muted italic">
          {{ story.dark_tower_relation }}
        </p>

        <template v-if="collectionItems.length" #related>
          <DetailConnectionList heading="Appears In" :items="collectionItems" />
        </template>
      </DetailHero>
    </template>

    <DetailConnectionList
      heading="Adaptations"
      :items="adaptationItems"
      placeholder-icon="i-lucide-film"
      orientation="horizontal"
    />
  </NuxtLayout>
</template>
