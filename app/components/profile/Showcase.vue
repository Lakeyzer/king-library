<script setup lang="ts">
import type {
  BookRecommendation,
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
import type {
  CurrentlyReadingRelatedWork,
  ReadingTimelineRelatedEntry,
  RelatedWorkProfileStats
} from '~/composables/useRelatedWorks'
import type { RelatedWorkBookshelfItem } from '~/composables/useRelatedWorkEditions'
import type { CurrentlyReadingItem } from './CurrentlyReading.vue'
import type { ReadingTimelineItem } from './ReadingTimeline.vue'
import type { ProfileBookshelfItem } from './Bookshelf.vue'

interface Props {
  isOwner: boolean
  /** Path to this profile owner's dedicated Reading Timeline page - see the reading-timeline capability. */
  timelinePath: string
  stats: ProfileBookStats
  viewing: ViewingProgress
  currentlyReading: CurrentlyReadingWork[]
  readingTimeline: ReadingTimelineEntry[]
  bookshelf: BookshelfItem[]
  relatedWorkStats: RelatedWorkProfileStats
  relatedCurrentlyReading: CurrentlyReadingRelatedWork[]
  relatedTimeline: ReadingTimelineRelatedEntry[]
  relatedBookshelf: RelatedWorkBookshelfItem[]
  bookRecommendation?: BookRecommendation | null
  ownedUnreadRecommendation?: OwnedUnreadRecommendation | null
  adaptationRecommendation?: AdaptationRecommendation | null
  giftIdeaRecommendation?: GiftIdeaRecommendation | null
}

const props = withDefaults(defineProps<Props>(), {
  bookRecommendation: null,
  ownedUnreadRecommendation: null,
  adaptationRecommendation: null,
  giftIdeaRecommendation: null
})

const mergedCurrentlyReading = computed<CurrentlyReadingItem[]>(() => {
  const items: CurrentlyReadingItem[] = [
    ...props.currentlyReading.map(item => ({ ...item, source: 'king' as const })),
    ...props.relatedCurrentlyReading.map(item => ({ ...item, source: 'related' as const }))
  ]
  return items.sort((a, b) => (b.startedOn ?? '').localeCompare(a.startedOn ?? ''))
})

// Same "most recent first" key as useBooks().fetchReadingTimeline's own
// client-side sort (readOn, falling back to readYear as Jan 1st of that
// year) - reapplied here since merging two already-sorted lists doesn't
// keep the combined result sorted on its own. A related entry has no
// readYear fallback (see ReadingTimelineRelatedEntry), so it sorts by
// readOn alone.
function timelineSortKey(entry: { readOn: string | null, readYear: number | null }): string {
  return entry.readOn ?? (entry.readYear ? `${entry.readYear}-01-01` : '')
}

// Always merged in, unlike the two progress cards below - see
// profile-showcase's "Bookshelf and reading timeline always include By
// Other Hands works".
const mergedReadingTimeline = computed<ReadingTimelineItem[]>(() => {
  const kingItems: ReadingTimelineItem[] = props.readingTimeline.map(entry => ({
    ...entry,
    source: 'king' as const
  }))

  const relatedItems: ReadingTimelineItem[] = props.relatedTimeline.map(entry => ({
    source: 'related' as const,
    readId: entry.workId,
    workId: entry.workId,
    title: entry.title,
    slug: entry.slug,
    coverId: entry.coverId,
    startedOn: entry.startedOn,
    readOn: entry.readOn,
    readYear: null,
    note: entry.note,
    format: entry.format,
    rating: entry.rating
  }))

  return [...kingItems, ...relatedItems].sort((a, b) => timelineSortKey(b).localeCompare(timelineSortKey(a)))
})

// Always merged in, unlike the two progress cards below - see
// profile-showcase's "Bookshelf and reading timeline always include By
// Other Hands works".
const mergedBookshelf = computed<ProfileBookshelfItem[]>(() => {
  const kingItems: ProfileBookshelfItem[] = props.bookshelf.map(item => ({ ...item, source: 'king' as const }))

  const relatedItems: ProfileBookshelfItem[] = props.relatedBookshelf.map(item => ({
    ...item,
    source: 'related' as const,
    publishDate: item.publishDate ?? '',
    seriesId: null,
    seriesName: null,
    seriesPosition: null
  }))

  return [...kingItems, ...relatedItems].sort((a, b) => a.workTitle.localeCompare(b.workTitle))
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
        :items="mergedReadingTimeline"
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
          :items="mergedBookshelf"
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
          :items="mergedCurrentlyReading"
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
