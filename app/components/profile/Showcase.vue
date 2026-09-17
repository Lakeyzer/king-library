<script setup lang="ts">
import type {
  BookRecommendation,
  CurrentlyReadingWork,
  GiftIdeaRecommendation,
  OwnedUnreadRecommendation,
  ProfileBookStats,
  ReadingTimelineEntry,
} from "~/composables/useBooks";
import type {
  AdaptationRecommendation,
  ViewingProgress,
} from "~/composables/useAdaptations";
import type { BookshelfItem } from "~/composables/useBookshelf";

interface Props {
  isOwner: boolean;
  /** Path to this profile owner's dedicated Reading Timeline page - see the reading-timeline capability. */
  timelinePath: string;
  stats: ProfileBookStats;
  viewing: ViewingProgress;
  currentlyReading: CurrentlyReadingWork[];
  readingTimeline: ReadingTimelineEntry[];
  bookshelf: BookshelfItem[];
  bookRecommendation?: BookRecommendation | null;
  ownedUnreadRecommendation?: OwnedUnreadRecommendation | null;
  adaptationRecommendation?: AdaptationRecommendation | null;
  giftIdeaRecommendation?: GiftIdeaRecommendation | null;
}

withDefaults(defineProps<Props>(), {
  bookRecommendation: null,
  ownedUnreadRecommendation: null,
  adaptationRecommendation: null,
  giftIdeaRecommendation: null,
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
          <UIcon name="i-lucide-scroll-text" class="size-5" />
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
      <ProfileReadingTimeline :items="readingTimeline" :is-owner="isOwner" />
    </div>

    <div class="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
      <div class="flex flex-1 flex-col gap-3">
        <h2
          class="flex items-center gap-2 text-lg font-semibold text-highlighted"
        >
          <UIcon name="i-lucide-chart-no-axes-combined" class="size-5" />
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
            icon="i-lucide-castle"
            :count="stats.darkTower.count"
            :total="stats.darkTower.total"
            color="success"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <ProfileBookshelf :items="bookshelf" :is-owner="isOwner" />
      </div>

      <div class="flex w-full shrink-0 flex-col gap-3 lg:w-96">
        <h2
          class="flex items-center gap-2 text-lg font-semibold text-highlighted"
        >
          <UIcon name="i-lucide-sparkles" class="size-5" />
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
