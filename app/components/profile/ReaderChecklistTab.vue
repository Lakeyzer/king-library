<script setup lang="ts">
const { profile, isOwner } = useViewedProfile();

const {
  fetchProfileBookStats,
  fetchCurrentlyReading,
  fetchReadingTimeline,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation,
  fetchGiftIdeaRecommendation,
} = useBooks();
const { fetchViewingProgress, fetchUnwatchedRecommendation } = useAdaptations();
const { fetchBookshelf } = useBookshelf();

const [
  { data: stats },
  { data: viewing },
  { data: currentlyReading },
  { data: readingTimeline },
  { data: bookshelf },
] = await Promise.all([
  useAsyncData(`profile-${profile.id}-book-stats`, () => fetchProfileBookStats(profile.id)),
  useAsyncData(`profile-${profile.id}-viewing-progress`, () => fetchViewingProgress(profile.id)),
  useAsyncData(`profile-${profile.id}-currently-reading`, () => fetchCurrentlyReading(profile.id)),
  useAsyncData(`profile-${profile.id}-reading-timeline`, () => fetchReadingTimeline(profile.id)),
  useAsyncData(`profile-${profile.id}-bookshelf`, () => fetchBookshelf(profile.id)),
]);

// Unlike the fetches above, these two really are owner-gated (not just
// privacy-gated) - they're personal "read/watch this next" nudges, never
// shown on someone else's profile even when public, so the isOwner check
// here is the actual product rule, not a shortcut around RLS.
const [
  { data: bookRecommendation },
  { data: ownedUnreadRecommendation },
  { data: adaptationRecommendation },
] = await Promise.all([
  useAsyncData(`profile-${profile.id}-book-recommendation`, () =>
    isOwner.value ? fetchUnreadRecommendation(profile.id) : Promise.resolve(null),
  ),
  useAsyncData(`profile-${profile.id}-owned-unread-recommendation`, () =>
    isOwner.value ? fetchOwnedUnreadRecommendation(profile.id) : Promise.resolve(null),
  ),
  useAsyncData(`profile-${profile.id}-adaptation-recommendation`, () =>
    isOwner.value ? fetchUnwatchedRecommendation(profile.id) : Promise.resolve(null),
  ),
]);

// The inverse gate from the three recommendations above: a gift idea is
// only ever for a *different* visitor looking at this profile, never for
// the owner viewing their own showcase - see profile-showcase spec "Non-owner
// sees a gift-idea recommendation for a wanted-but-not-owned book".
const { data: giftIdeaRecommendation } = await useAsyncData(
  `profile-${profile.id}-gift-idea-recommendation`,
  () => (isOwner.value ? Promise.resolve(null) : fetchGiftIdeaRecommendation(profile.id)),
);
</script>

<template>
  <ProfileShowcase
    v-if="stats && viewing && currentlyReading && readingTimeline"
    :is-owner="isOwner"
    :stats="stats"
    :viewing="viewing"
    :currently-reading="currentlyReading"
    :reading-timeline="readingTimeline"
    :bookshelf="bookshelf ?? []"
    :book-recommendation="bookRecommendation ?? null"
    :owned-unread-recommendation="ownedUnreadRecommendation ?? null"
    :adaptation-recommendation="adaptationRecommendation ?? null"
    :gift-idea-recommendation="giftIdeaRecommendation ?? null"
  />
</template>
