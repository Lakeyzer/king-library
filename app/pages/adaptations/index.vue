<script setup lang="ts">
import type { Adaptation } from '~/composables/useAdaptations'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Adaptations',
  description:
    'Browse every movie and TV adaptation of Stephen King\'s work, and track what you\'ve watched and what\'s on your watchlist.'
})

const user = useSupabaseUser()

const {
  fetchAdaptations,
  fetchAdaptationHighlights,
  fetchUnwatchedRecommendation,
  fetchUserAdaptations
} = useAdaptations()
const { data: adaptations } = await useAsyncData(
  'adaptations',
  fetchAdaptations
)

// Not awaited: only affects the watch-status buttons' displayed state,
// which updates reactively once it resolves - same as the adaptation
// detail page.
useAsyncData('user-adaptations', fetchUserAdaptations)
const { data: adaptationHighlights } = await useAsyncData(
  'adaptations-page-highlights',
  fetchAdaptationHighlights
)
const { data: adaptationRecommendation } = await useAsyncData(
  'adaptations-page-recommendation',
  () =>
    user.value
      ? fetchUnwatchedRecommendation(user.value.sub)
      : Promise.resolve(null)
)

// A single anthology episode is listed under its own title, with its series
// and episode number underneath, e.g. "Tales from the Darkside · S01E08".
const episodeSubtitle = (adaptation: Adaptation) => {
  if (!adaptation.episode_of || adaptation.tmdb_season_number == null || adaptation.tmdb_episode_number == null) return null
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${adaptation.episode_of} · S${pad(adaptation.tmdb_season_number)}E${pad(adaptation.tmdb_episode_number)}`
}

const watchedCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'watch' : 'watches'}`
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
    :subtitle-of="episodeSubtitle"
    placeholder-icon="i-lucide-film"
    sort-year-label="Release year"
  >
    <template #header-actions>
      <ReportButton
        mode="missing-content"
        content-area="adaptations"
      />
    </template>

    <template #item-actions="{ item }">
      <AdaptationWatchActions
        :adaptation-id="(item as Adaptation).id"
        :release-date="(item as Adaptation).release_date"
        :release-year="(item as Adaptation).release_year"
        mode="compact"
      />
    </template>

    <template
      v-if="adaptationHighlights"
      #sidebar
    >
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
