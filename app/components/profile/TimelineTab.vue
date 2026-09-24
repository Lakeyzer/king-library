<script setup lang="ts">
import type { KingWork } from '~/composables/useKingWorks'
import type { ReadingTimelineItem } from '~/components/profile/ReadingTimeline.vue'

const { profile, isOwner } = useViewedProfile()

const { fetchReadingTimeline } = useBooks()
const { fetchReadingTimelineRelatedWorks } = useRelatedWorks()

// Same useAsyncData key as ReaderChecklistTab's showcase widget - shares
// its cache rather than firing a second, redundant fetch (see
// nuxt-conventions "BookReadingActions needs its page to pre-fetch status"
// for why exact key reuse matters here).
const [
  { data: readingTimeline, refresh: refreshTimeline },
  { data: relatedTimeline }
] = await Promise.all([
  useAsyncData(`profile-${profile.id}-reading-timeline`, () => fetchReadingTimeline(profile.id)),
  useAsyncData(`profile-${profile.id}-related-timeline`, () => fetchReadingTimelineRelatedWorks(profile.id))
])

// Same "most recent first" merge as ProfileShowcase's mergedReadingTimeline -
// see that component's own timelineSortKey for why a related entry has no
// readYear fallback.
function timelineSortKey(entry: { readOn: string | null, readYear: number | null }): string {
  return entry.readOn ?? (entry.readYear ? `${entry.readYear}-01-01` : '')
}

const timelineItems = computed<ReadingTimelineItem[]>(() => {
  const kingItems: ReadingTimelineItem[] = (readingTimeline.value ?? []).map(entry => ({
    ...entry,
    source: 'king' as const
  }))

  const relatedItems: ReadingTimelineItem[] = (relatedTimeline.value ?? []).map(entry => ({
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

const showSearchModal = ref(false)
const selectedWork = ref<KingWork | null>(null)
const showMarkReadModal = ref(false)

function handleWorkSelected(work: KingWork) {
  selectedWork.value = work
  showMarkReadModal.value = true
}

// The new logged read lives in user_book_reads, which this page's
// useAsyncData snapshot has no way to know changed on its own - refresh
// once BookMarkReadModal confirms the write instead of leaving the new
// entry missing until the next full page load.
function handleLogged() {
  refreshTimeline()
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between gap-2">
      <h1
        class="flex items-center gap-2 text-xl font-semibold text-highlighted"
      >
        <UIcon
          name="i-lucide-scroll-text"
          class="size-5"
        />
        <NumberMotif
          :text="
            isOwner
              ? 'Reading Timeline'
              : `${profile.username}'s Reading Timeline`
          "
        />
      </h1>
      <UButton
        v-if="isOwner"
        label="Add to Timeline"
        icon="i-lucide-plus"
        color="neutral"
        variant="subtle"
        size="sm"
        @click="showSearchModal = true"
      />
    </div>

    <UEmpty
      v-if="!timelineItems.length"
      icon="i-lucide-book-check"
      title="No finished books yet"
      description="Books you finish will show up here."
    />
    <ProfileReadingTimeline
      v-else
      :items="timelineItems"
      :is-owner="isOwner"
      orientation="vertical"
    />

    <template v-if="isOwner">
      <BookSearchWorkModal
        v-model:open="showSearchModal"
        @selected="handleWorkSelected"
      />
      <BookMarkReadModal
        v-if="selectedWork"
        v-model:open="showMarkReadModal"
        :work-id="selectedWork.id"
        :work-title="selectedWork.title"
        @logged="handleLogged"
      />
    </template>
  </div>
</template>
