<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Constant Reader Checklist',
  description:
    'An unofficial Stephen King reading checklist. Build your own bookshelf and track your reading progress, wishlist, and check off books, short works, and adaptations.'
})

// Only read inside the browser-only fetches below - anything rendered per
// viewer goes through useViewer() instead (see composables/useViewer.ts).
const user = useSupabaseUser()
const { user: viewerUser, isReady: viewerReady } = useViewer()
const { open: openAuthModal } = useAuthModal()

// Landing here with ?signin=1 means the onboarding middleware just bounced
// a signed-out visitor away from a page that requires sign-in (its `next`
// query param, read by AuthModal on successful sign-in, is what sends them
// back there afterward) - open the modal for them rather than leaving them
// to notice and click "Sign in" themselves.
const route = useRoute()
onMounted(() => {
  if (route.query.signin) openAuthModal()
})

const { fetchHomepageMeta } = useHomepage()
const {
  fetchWorkHighlights,
  fetchUserBooks,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation
} = useBooks()
const {
  fetchAdaptationHighlights,
  fetchUnwatchedRecommendation,
  fetchUserAdaptations
} = useAdaptations()

// This page is cached until the next deploy (shared/utils/cachedRoutes.ts),
// and everything on it below the hero is either a community figure, a
// date-based highlight (Book of the week / birthdays, picked by the visitor's
// own date) or personal - so it all loads in the browser (server: false) and
// the cached HTML is just the hero plus a skeleton. See the page-caching spec.
const { data: meta } = useAsyncData('homepage-meta', fetchHomepageMeta, { server: false })
const { data: workHighlights } = useAsyncData('homepage-work-highlights', fetchWorkHighlights, { server: false })
const { data: adaptationHighlights } = useAsyncData('homepage-adaptation-highlights', fetchAdaptationHighlights, { server: false })

const { fetchOwnWishlist } = useWishlist()
useAsyncData('user-books', fetchUserBooks, { server: false })
useAsyncData('user-wishlist', fetchOwnWishlist, { server: false })
useAsyncData('user-adaptations', fetchUserAdaptations, { server: false })

const { data: bookRecommendation } = useAsyncData(
  'book-recommendation',
  () => (user.value ? fetchUnreadRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
)
const { data: ownedUnreadRecommendation } = useAsyncData(
  'owned-unread-recommendation',
  () => (user.value ? fetchOwnedUnreadRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
)
const { data: adaptationRecommendation } = useAsyncData(
  'adaptation-recommendation',
  () => (user.value ? fetchUnwatchedRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
)

const readsCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'read' : 'reads'}`
const currentlyReadingCountLabel = (count: number) => `${count} reading now`
const watchedCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'watch' : 'watches'}`
const wantToReadCountLabel = (count: number) => `${count} want to read this`
const wantToWatchCountLabel = (count: number) => `${count} want to watch this`
</script>

<template>
  <div>
    <UPageHero
      title="King Library"
      description="An unofficial Stephen King reading checklist. Build your own bookshelf and track your reading progress, wishlist, and check off books, short works, and adaptations."
      orientation="horizontal"
    >
      <div class="flex h-full items-center justify-center lg:justify-end">
        <USkeleton
          v-if="!viewerReady"
          class="h-12 w-72 rounded-md"
        />
        <UButton
          v-else-if="viewerUser"
          label="Add to Your Collection"
          icon="i-lucide-library"
          size="xl"
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
          to="/short-works"
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
          <HomepageLinkCard
            to="/suggestion-box"
            icon="i-lucide-mailbox"
            title="Suggestion Box"
            description="Vote on ideas put forward by users"
          />
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
                  adaptationHighlights.mostAnticipatedAdaptation.count
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

    <HomepageSkeleton v-else />
  </div>
</template>
