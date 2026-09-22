<script setup lang="ts">
import type { WatchListEntry } from '~/composables/useAdaptations'

const { profile, isOwner } = useViewedProfile()

const title = computed(() => (isOwner.value ? 'Watch List' : `${profile.username}'s Watch List`))
const emptyDescription = computed(() =>
  isOwner.value
    ? 'Adaptations you mark want-to-watch will show up here.'
    : `${profile.username} hasn't marked anything want-to-watch yet.`
)

const { fetchWatchList, fetchUserAdaptations } = useAdaptations()

// Always query, even for a private profile viewed by its own owner mid-
// transition - RLS on user_adaptations is the actual gate (see
// supabase-conventions), and the by-username leaf pages already refuse to
// render this tab at all for a non-owner visitor when the profile is
// private (RouteChrome's isPrivate prop, set via useProfileRouteByUsername).
const { data: adaptations } = await useAsyncData(`profile-${profile.id}-watch-list`, () =>
  fetchWatchList(profile.id)
)

// Populates userAdaptationsByAdaptationId so each item's
// AdaptationWatchActions reflects the *viewer's own* want-to-watch/watched
// state for that adaptation - same as every other bibliography-browsing
// page, regardless of whose list this is.
await useAsyncData('user-adaptations', fetchUserAdaptations)
</script>

<template>
  <BibliographyBrowsePage
    :title="title"
    description="Adaptations marked want-to-watch."
    detail-path-prefix="/adaptations"
    :items="adaptations ?? []"
    :year-of="(adaptation: WatchListEntry) => adaptation.releaseYear"
    :image-src-of="
      (adaptation: WatchListEntry) =>
        adaptation.tmdbPosterPath ? getTmdbPosterUrl(adaptation.tmdbPosterPath, 'w154') : null
    "
    :image-alt-of="(adaptation: WatchListEntry) => `${adaptation.title} poster`"
    placeholder-icon="i-lucide-clapperboard"
    sort-year-label="Release year"
    :show-sort="false"
    empty-icon="i-lucide-clapperboard"
    empty-title="Nothing queued to watch"
    :empty-description="emptyDescription"
  >
    <template #item-actions="{ item }">
      <AdaptationWatchActions
        :adaptation-id="(item as WatchListEntry).id"
        mode="compact"
      />
    </template>
  </BibliographyBrowsePage>
</template>
