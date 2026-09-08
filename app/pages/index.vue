<script setup lang="ts">
definePageMeta({ layout: "default" });

const user = useSupabaseUser();
const { open: openAuthModal } = useAuthModal();

const { fetchHomepageMeta } = useHomepage();
const {
  fetchWorkHighlights,
  fetchUserBooks,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation,
} = useBooks();
const { fetchAdaptationHighlights, fetchUnwatchedRecommendation } =
  useAdaptations();

const [
  { data: meta },
  { data: workHighlights },
  { data: adaptationHighlights },
] = await Promise.all([
  useAsyncData("homepage-meta", fetchHomepageMeta),
  useAsyncData("homepage-work-highlights", fetchWorkHighlights),
  useAsyncData("homepage-adaptation-highlights", fetchAdaptationHighlights),
]);

await useAsyncData("user-books", fetchUserBooks);

const [
  { data: bookRecommendation },
  { data: ownedUnreadRecommendation },
  { data: adaptationRecommendation },
] = await Promise.all([
  useAsyncData("book-recommendation", () =>
    user.value
      ? fetchUnreadRecommendation(user.value.sub)
      : Promise.resolve(null),
  ),
  useAsyncData("owned-unread-recommendation", () =>
    user.value
      ? fetchOwnedUnreadRecommendation(user.value.sub)
      : Promise.resolve(null),
  ),
  useAsyncData("adaptation-recommendation", () =>
    user.value
      ? fetchUnwatchedRecommendation(user.value.sub)
      : Promise.resolve(null),
  ),
]);

const readsCountLabel = (count: number) =>
  `${count} ${count === 1 ? "read" : "reads"}`;
const currentlyReadingCountLabel = (count: number) => `${count} reading now`;
const watchedCountLabel = (count: number) =>
  `${count} ${count === 1 ? "watch" : "watches"}`;
const wantToReadCountLabel = (count: number) => `${count} want to read this`;
const wantToWatchCountLabel = (count: number) => `${count} want to watch this`;
</script>

<template>
  <div>
    <UPageHero
      title="King Library"
      description="Build your own Stephen King bookshelf and track your reading progress — collect, wishlist, and check off books, short works, and adaptations as you go."
      orientation="horizontal"
    >
      <div class="flex h-full items-center justify-center">
        <UButton
          v-if="user"
          label="Add to Your Collection"
          icon="i-lucide-library"
          size="lg"
          to="/works"
        />
        <UButton
          v-else
          label="Start Tracking Your Reading"
          icon="i-lucide-book-open"
          size="lg"
          @click="openAuthModal"
        />
      </div>
    </UPageHero>

    <div
      v-if="meta && workHighlights && adaptationHighlights"
      class="flex flex-col gap-6 py-8"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HomepageCatalogLinkCard
          to="/works"
          icon="i-lucide-book"
          label="Works"
          :count="meta.catalogTotals.worksCount"
        />
        <HomepageCatalogLinkCard
          to="/short-stories"
          icon="i-lucide-file-text"
          label="Short Works"
          :count="meta.catalogTotals.shortStoriesCount"
        />
        <HomepageCatalogLinkCard
          to="/adaptations"
          icon="i-lucide-film"
          label="Adaptations"
          :count="meta.catalogTotals.adaptationsCount"
        />
      </div>

      <div class="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
        <div class="flex flex-1 flex-col gap-6">
          <WorkLeaderboard
            title="Most Read Books"
            icon="i-lucide-trending-up"
            :items="workHighlights.mostReadBooks"
            :count-label="readsCountLabel"
            empty-message="No books have been marked read yet."
          />
          <WorkLeaderboard
            title="Currently Being Read"
            icon="i-lucide-book-open-text"
            :items="workHighlights.currentlyReadingLeaderboard"
            :count-label="currentlyReadingCountLabel"
            empty-message="No one is currently reading anything."
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
        </div>

        <div class="flex w-full flex-col gap-6 lg:w-96 lg:shrink-0">
          <HomepageStatsBar :stats="meta.stats" />
          <WorkSpotlight
            title="Book of the Week"
            icon="i-lucide-sparkles"
            :work="workHighlights.bookOfTheWeek"
            empty-message="No book is featured right now."
          />
          <WorkBirthday :works="workHighlights.bookBirthdays" />
          <WorkLeastReadSpotlight :work="workHighlights.leastReadBook" />
          <WorkSpotlight
            title="Most Wanted"
            icon="i-lucide-flame"
            :work="workHighlights.mostWantedBook"
            :meta="
              workHighlights.mostWantedBook
                ? wantToReadCountLabel(workHighlights.mostWantedBook.count)
                : undefined
            "
            empty-message="No one has added a want-to-read yet."
          />
          <AdaptationSpotlight
            title="Most Anticipated"
            icon="i-lucide-popcorn"
            :adaptation="adaptationHighlights.mostAnticipatedAdaptation"
            :meta="
              adaptationHighlights.mostAnticipatedAdaptation
                ? wantToWatchCountLabel(
                    adaptationHighlights.mostAnticipatedAdaptation.count,
                  )
                : undefined
            "
            empty-message="No one is looking forward to an adaptation yet."
          />
          <WorkRecommendation :recommendation="bookRecommendation ?? null" />
          <WorkOwnedRecommendation
            :recommendation="ownedUnreadRecommendation ?? null"
          />
          <AdaptationRecommendation
            :recommendation="adaptationRecommendation ?? null"
          />
        </div>
      </div>
    </div>
  </div>
</template>
