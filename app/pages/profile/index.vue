<script setup lang="ts">
definePageMeta({ layout: "default" });

const user = useSupabaseUser();
const { profile } = useProfile();
const { fetchProfileBookStats, fetchCurrentlyReading, fetchReadingTimeline } =
  useBooks();
const { fetchViewingProgress } = useAdaptations();

const userId = computed(() => user.value?.sub ?? "");

const [
  { data: stats },
  { data: viewing },
  { data: currentlyReading },
  { data: readingTimeline },
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
    />
  </div>
</template>
