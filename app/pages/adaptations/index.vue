<script setup lang="ts">
import type { Adaptation } from '~/composables/useAdaptations'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Adaptations',
  description:
    'Browse every movie and TV adaptation of Stephen King\'s work, and track what you\'ve watched and what\'s on your watchlist.'
})

// Only read inside the browser-only fetches below - anything rendered per
// viewer goes through useViewer() instead (see composables/useViewer.ts).
const user = useSupabaseUser()
const { user: viewerUser } = useViewer()

const {
  userAdaptationsByAdaptationId,
  userAdaptationsLoaded,
  fetchAdaptations,
  fetchAdaptationHighlights,
  fetchUnwatchedRecommendation,
  fetchUserAdaptations
} = useAdaptations()
const { data: adaptations } = await useAsyncData(
  'adaptations',
  fetchAdaptations
)

// This page is cached until the next deploy (shared/utils/cachedRoutes.ts),
// so only the adaptations list is server-rendered. Watch status, the
// leaderboards (community figures) and the recommendation load in the
// browser - see the page-caching spec.
useAsyncData('user-adaptations', fetchUserAdaptations, { server: false })
const { data: adaptationHighlights } = useAsyncData(
  'adaptations-page-highlights',
  fetchAdaptationHighlights,
  { server: false }
)
const { data: adaptationRecommendation } = useAsyncData(
  'adaptations-page-recommendation',
  () => (user.value ? fetchUnwatchedRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
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

// Offered once the viewer's own watch status has loaded - filtering on an
// empty store would wrongly list everything as unwatched.
const statusFilter = computed(() =>
  viewerUser.value && userAdaptationsLoaded.value
    ? {
        doneLabel: 'Watched',
        notDoneLabel: 'Unwatched',
        isDone: (adaptation: Adaptation) =>
          !!userAdaptationsByAdaptationId.value[adaptation.id]?.watched
      }
    : undefined
)
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
    :status-filter="statusFilter"
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

    <template #sidebar>
      <HighlightsSkeleton
        v-if="!adaptationHighlights"
        :count="2"
      />
      <template v-else>
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
    </template>
  </BibliographyBrowsePage>
</template>
