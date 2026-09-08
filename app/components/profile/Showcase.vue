<script setup lang="ts">
import type {
  BookRecommendation,
  CurrentlyReadingWork,
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
  username: string;
  avatarUrl?: string | null;
  isOwner: boolean;
  stats: ProfileBookStats;
  viewing: ViewingProgress;
  currentlyReading: CurrentlyReadingWork[];
  readingTimeline: ReadingTimelineEntry[];
  bookshelf: BookshelfItem[];
  bookRecommendation?: BookRecommendation | null;
  ownedUnreadRecommendation?: OwnedUnreadRecommendation | null;
  adaptationRecommendation?: AdaptationRecommendation | null;
}

withDefaults(defineProps<Props>(), {
  bookRecommendation: null,
  ownedUnreadRecommendation: null,
  adaptationRecommendation: null,
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center gap-4">
      <UAvatar :src="avatarUrl ?? undefined" icon="i-lucide-user" size="xl" />
      <div>
        <h1 class="text-2xl font-bold text-highlighted">@{{ username }}</h1>
        <p class="text-muted text-sm">Stephen King reading showcase</p>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <h2
        class="flex items-center gap-2 text-lg font-semibold text-highlighted"
      >
        <UIcon name="i-lucide-scroll-text" class="size-5" />
        Reading Journey
      </h2>
      <ProfileReadingTimeline :items="readingTimeline" />
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
            color="neutral"
          />
          <ProfileProgressBar
            label="Dark Tower"
            icon="i-lucide-castle"
            :count="stats.darkTower.count"
            :total="stats.darkTower.total"
            color="secondary"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileProgressBar
            label="Adaptations Watched"
            icon="i-lucide-film"
            :count="viewing.count"
            :total="viewing.total"
            color="info"
          />
          <ProfileProgressBar
            label="Collection"
            icon="i-lucide-library"
            :count="stats.collection.count"
            :total="stats.collection.total"
            color="success"
          />
        </div>

        <ProfileBookshelf :items="bookshelf" :is-owner="isOwner" />
      </div>

      <div class="flex w-full shrink-0 flex-col gap-3 lg:w-56">
        <h2
          class="flex items-center gap-2 text-lg font-semibold text-highlighted"
        >
          <UIcon name="i-lucide-book-open-text" class="size-5" />
          Currently Reading
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
      </div>
    </div>
  </div>
</template>
