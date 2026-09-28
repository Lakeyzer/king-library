<script setup lang="ts">
import type {
  BookRecommendation,
  CategoryProgress,
  CurrentlyReadingWork,
  GiftIdeaRecommendation,
  OwnedUnreadRecommendation,
  ProfileBookStats,
  ReadingTimelineEntry
} from '~/composables/useBooks'
import type {
  AdaptationRecommendation,
  ViewingProgress
} from '~/composables/useAdaptations'
import type { BookshelfItem } from '~/composables/useBookshelf'
import type { RelatedWorkProfileStats } from '~/composables/useRelatedWorks'

interface Props {
  isOwner: boolean
  /** Path to this profile owner's dedicated Reading Timeline page - see the reading-timeline capability. */
  timelinePath: string
  stats: ProfileBookStats
  viewing: ViewingProgress
  shortStoryProgress: CategoryProgress
  /** Currently Reading, the reading timeline, and the Bookshelf each cover King and related works alike - see profile-showcase "Bookshelf and reading timeline always include By Other Hands works". The King progress cards (stats) never count related works. */
  currentlyReading: CurrentlyReadingWork[]
  readingTimeline: ReadingTimelineEntry[]
  bookshelf: BookshelfItem[]
  relatedWorkStats: RelatedWorkProfileStats
  bookRecommendation?: BookRecommendation | null
  ownedUnreadRecommendation?: OwnedUnreadRecommendation | null
  adaptationRecommendation?: AdaptationRecommendation | null
  giftIdeaRecommendation?: GiftIdeaRecommendation | null
}

withDefaults(defineProps<Props>(), {
  bookRecommendation: null,
  ownedUnreadRecommendation: null,
  adaptationRecommendation: null,
  giftIdeaRecommendation: null
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="heading-2 flex items-center gap-2">
          <UIcon
            name="i-lucide-scroll-text"
            class="size-5"
          />
          Reading Journey
        </h2>
        <UButton
          label="View Full Timeline"
          icon="i-lucide-arrow-right"
          trailing
          color="neutral"
          variant="link"
          size="sm"
          :to="timelinePath"
        />
      </div>
      <ProfileReadingTimeline
        :items="readingTimeline"
        :is-owner="isOwner"
      />
    </div>

    <div class="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
      <div class="flex flex-1 flex-col gap-3">
        <h2 class="heading-2 flex items-center gap-2">
          <UIcon
            name="i-lucide-chart-no-axes-combined"
            class="size-5"
          />
          Reading Progress
        </h2>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProfileProgressBar
            label="Overall Bibliography"
            icon="i-lucide-book-open"
            :count="stats.overall.count"
            :total="stats.overall.total"
            color="primary"
          />
          <ProfileProgressBar
            label="Bachman Books"
            icon="i-lucide-user-round"
            :count="stats.bachman.count"
            :total="stats.bachman.total"
            color="warning"
          />
          <ProfileProgressBar
            label="Dark Tower"
            icon="i-lucide-rose"
            :count="stats.darkTower.count"
            :total="stats.darkTower.total"
            color="error"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProfileProgressBar
            label="Short Works"
            icon="i-lucide-file-text"
            :count="shortStoryProgress.count"
            :total="shortStoryProgress.total"
            color="success"
          />
          <ProfileProgressBar
            label="Adaptations Watched"
            icon="i-lucide-film"
            :count="viewing.count"
            :total="viewing.total"
            color="secondary"
          />
          <ProfileProgressBar
            label="Collection"
            icon="i-lucide-library"
            :count="stats.collection.count"
            :total="stats.collection.total"
            color="info"
          />
        </div>

        <div
          v-if="relatedWorkStats.overall.count > 0"
          class="flex flex-col gap-3"
        >
          <h2 class="heading-2 flex items-center gap-2">
            <UIcon
              name="i-lucide-feather"
              class="size-5"
            />
            Works by Others
          </h2>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileProgressBar
              v-if="relatedWorkStats.overall.count > 0"
              label="Works by Others Read"
              icon="i-lucide-feather"
              :count="relatedWorkStats.overall.count"
              :total="relatedWorkStats.overall.total"
              color="info"
            />
            <ProfileProgressBar
              v-if="relatedWorkStats.comics.count > 0"
              label="Graphic Novels Read"
              icon="i-lucide-rose"
              :count="relatedWorkStats.comics.count"
              :total="relatedWorkStats.comics.total"
              color="warning"
            />
          </div>
        </div>

        <ProfileBookshelf
          :items="bookshelf"
          :is-owner="isOwner"
        />
      </div>

      <div class="flex w-full shrink-0 flex-col gap-3 lg:w-96">
        <h2 class="heading-2 flex items-center gap-2">
          <UIcon
            name="i-lucide-sparkles"
            class="size-5"
          />
          Spotlight
        </h2>
        <ProfileCurrentlyReading
          :items="currentlyReading"
          :is-owner="isOwner"
        />

        <WorkRecommendation
          v-if="isOwner"
          :recommendation="bookRecommendation"
        />
        <WorkOwnedRecommendation
          v-if="isOwner"
          :recommendation="ownedUnreadRecommendation"
        />
        <AdaptationRecommendation
          v-if="isOwner"
          :recommendation="adaptationRecommendation"
        />
        <WorkGiftRecommendation
          v-if="!isOwner"
          :recommendation="giftIdeaRecommendation"
        />
      </div>
    </div>
  </div>
</template>
