<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const username = route.params.username as string;

const user = useSupabaseUser();
const { fetchProfileByUsername } = useProfile();

const { data: viewedProfile } = await useAsyncData(`profile-${username}`, () =>
  fetchProfileByUsername(username),
);

if (!viewedProfile.value) {
  throw createError({ statusCode: 404, statusMessage: "Profile not found" });
}

const profile = viewedProfile.value;
const isOwner = computed(() => user.value?.sub === profile.id);
const isPrivate = computed(() => !profile.is_public && !isOwner.value);

const {
  fetchProfileBookStats,
  fetchCurrentlyReading,
  fetchReadingTimeline,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation,
} = useBooks();
const { fetchViewingProgress, fetchUnwatchedRecommendation } =
  useAdaptations();
const { fetchBookshelf } = useBookshelf();

// Always query, even when the profile turns out to be private - RLS on
// user_books/user_adaptations already returns zero rows in that case, and
// duplicating that check here to decide whether to query would just be two
// places that can drift out of sync (see supabase-conventions). isPrivate
// only decides which component renders below.
const [
  { data: stats },
  { data: viewing },
  { data: currentlyReading },
  { data: readingTimeline },
  { data: bookshelf },
] = await Promise.all([
  useAsyncData(`profile-${username}-book-stats`, () =>
    fetchProfileBookStats(profile.id),
  ),
  useAsyncData(`profile-${username}-viewing-progress`, () =>
    fetchViewingProgress(profile.id),
  ),
  useAsyncData(`profile-${username}-currently-reading`, () =>
    fetchCurrentlyReading(profile.id),
  ),
  useAsyncData(`profile-${username}-reading-timeline`, () =>
    fetchReadingTimeline(profile.id),
  ),
  useAsyncData(`profile-${username}-bookshelf`, () =>
    fetchBookshelf(profile.id),
  ),
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
  useAsyncData(`profile-${username}-book-recommendation`, () =>
    isOwner.value
      ? fetchUnreadRecommendation(profile.id)
      : Promise.resolve(null),
  ),
  useAsyncData(`profile-${username}-owned-unread-recommendation`, () =>
    isOwner.value
      ? fetchOwnedUnreadRecommendation(profile.id)
      : Promise.resolve(null),
  ),
  useAsyncData(`profile-${username}-adaptation-recommendation`, () =>
    isOwner.value
      ? fetchUnwatchedRecommendation(profile.id)
      : Promise.resolve(null),
  ),
]);

useSeoMeta({ title: `${profile.username} — Profile` });
</script>

<template>
  <div class="py-8">
    <UEmpty
      v-if="isPrivate"
      icon="i-lucide-lock"
      title="This profile is private"
      description="The owner of this profile has chosen to keep it private."
    />
    <ProfileShowcase
      v-else-if="stats && viewing && currentlyReading && readingTimeline"
      :username="profile.username ?? ''"
      :avatar-url="profile.avatar_url"
      :is-owner="isOwner"
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
