<script setup lang="ts">
definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Your Profile",
  description:
    "View your Stephen King reading stats, watch progress, and bookshelf.",
});

const user = useSupabaseUser();
const { profile } = useProfile();
const {
  fetchProfileBookStats,
  fetchCurrentlyReading,
  fetchReadingTimeline,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation,
} = useBooks();
const { fetchViewingProgress, fetchUnwatchedRecommendation } = useAdaptations();
const { fetchBookshelf } = useBookshelf();

const userId = computed(() => user.value?.sub ?? "");

const [
  { data: stats },
  { data: viewing },
  { data: currentlyReading },
  { data: readingTimeline },
  { data: bookshelf },
  { data: bookRecommendation },
  { data: ownedUnreadRecommendation },
  { data: adaptationRecommendation },
] = await Promise.all([
  useAsyncData("own-profile-book-stats", () =>
    fetchProfileBookStats(userId.value),
  ),
  useAsyncData("own-profile-viewing-progress", () =>
    fetchViewingProgress(userId.value),
  ),
  useAsyncData("own-profile-currently-reading", () =>
    fetchCurrentlyReading(userId.value),
  ),
  useAsyncData("own-profile-reading-timeline", () =>
    fetchReadingTimeline(userId.value),
  ),
  useAsyncData("own-profile-bookshelf", () => fetchBookshelf(userId.value)),
  useAsyncData("own-profile-book-recommendation", () =>
    fetchUnreadRecommendation(userId.value),
  ),
  useAsyncData("own-profile-owned-unread-recommendation", () =>
    fetchOwnedUnreadRecommendation(userId.value),
  ),
  useAsyncData("own-profile-adaptation-recommendation", () =>
    fetchUnwatchedRecommendation(userId.value),
  ),
]);

useSeoMeta({
  title: profile.value?.username
    ? `${profile.value.username} — Profile`
    : "Profile",
});
</script>

<template>
  <div class="py-8">
    <ProfileShowcase
      v-if="stats && viewing && currentlyReading && readingTimeline"
      :username="profile?.username ?? ''"
      :avatar-url="profile?.avatar_url"
      :is-owner="true"
      :stats="stats"
      :viewing="viewing"
      :currently-reading="currentlyReading"
      :reading-timeline="readingTimeline"
      :bookshelf="bookshelf ?? []"
      :book-recommendation="bookRecommendation ?? null"
      :owned-unread-recommendation="ownedUnreadRecommendation ?? null"
      :adaptation-recommendation="adaptationRecommendation ?? null"
    />
  </div>
</template>
