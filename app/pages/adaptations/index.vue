<script setup lang="ts">
import type { Adaptation } from "~/composables/useAdaptations";

definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Adaptations",
  description:
    "Browse every movie and TV adaptation of Stephen King's work, and track what you've watched and what's on your watchlist.",
});

const user = useSupabaseUser();

const {
  fetchAdaptations,
  fetchAdaptationHighlights,
  fetchUnwatchedRecommendation,
  fetchUserAdaptations,
} = useAdaptations();
const { data: adaptations } = await useAsyncData(
  "adaptations",
  fetchAdaptations,
);

// Not awaited: only affects the watch-status buttons' displayed state,
// which updates reactively once it resolves - same as the adaptation
// detail page.
useAsyncData("user-adaptations", fetchUserAdaptations);
const { data: adaptationHighlights } = await useAsyncData(
  "adaptations-page-highlights",
  fetchAdaptationHighlights,
);
const { data: adaptationRecommendation } = await useAsyncData(
  "adaptations-page-recommendation",
  () =>
    user.value
      ? fetchUnwatchedRecommendation(user.value.sub)
      : Promise.resolve(null),
);

const watchedCountLabel = (count: number) =>
  `${count} ${count === 1 ? "watch" : "watches"}`;
</script>

<template>
  <BibliographyBrowsePage
    title="Adaptations"
    description="Browse film and television adaptations of Stephen King's work."
    detail-path-prefix="/adaptations"
    :items="adaptations ?? []"
    :year-of="(adaptation: Adaptation) => adaptation.release_year"
    :image-src-of="
      (adaptation: Adaptation) =>
        adaptation.tmdb_poster_path
          ? getTmdbPosterUrl(adaptation.tmdb_poster_path, 'w154')
          : null
    "
    :image-alt-of="(adaptation: Adaptation) => `${adaptation.title} poster`"
    placeholder-icon="i-lucide-film"
    sort-year-label="Release year"
  >
    <template #item-actions="{ item }">
      <AdaptationWatchActions :adaptation-id="(item as Adaptation).id" mode="compact" />
    </template>

    <template v-if="adaptationHighlights" #sidebar>
      <AdaptationRecommendation
        :recommendation="adaptationRecommendation ?? null"
      />
      <AdaptationLeaderboard
        title="Most Watched Adaptations"
        icon="i-lucide-clapperboard"
        :items="adaptationHighlights.mostWatchedAdaptations"
        :count-label="watchedCountLabel"
        empty-message="No adaptations have been marked watched yet."
      />
      <AdaptationLeaderboard
        title="Least Watched Adaptations"
        icon="i-lucide-trending-down"
        :items="adaptationHighlights.leastWatchedAdaptations"
        :count-label="watchedCountLabel"
        empty-message="No adaptations tracked yet."
      />
    </template>
  </BibliographyBrowsePage>
</template>
