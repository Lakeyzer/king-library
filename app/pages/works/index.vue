<script setup lang="ts">
import type { KingWork } from '~/composables/useKingWorks'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Works',
  description:
    'Browse every Stephen King novel and collection, track what you own, and mark books as read or want-to-read.'
})

const { fetchKingWorks } = useKingWorks()
const { fetchAllSeries } = useSeries()

// Only read inside the browser-only fetches below - anything rendered per
// viewer goes through useViewer() instead (see composables/useViewer.ts).
const user = useSupabaseUser()
const { user: viewerUser } = useViewer()

const {
  userBooksByWorkId,
  userBooksLoaded,
  fetchUserBooks,
  fetchWorkHighlights,
  fetchUnreadRecommendation,
  fetchOwnedUnreadRecommendation
} = useBooks()
const { fetchUserEditions } = useBookshelf()

// This page is cached until the next deploy (shared/utils/cachedRoutes.ts),
// so only the works list is server-rendered. Personal status, the highlights
// (community figures + the visitor's-date Book of the week and birthdays) and
// the recommendations all load in the browser - see the page-caching spec.
const { fetchOwnWishlist } = useWishlist()
useAsyncData('user-books', fetchUserBooks, { server: false })
useAsyncData('user-wishlist', fetchOwnWishlist, { server: false })
useAsyncData('user-editions', fetchUserEditions, { server: false })

const { data: workHighlights } = useAsyncData('works-page-highlights', fetchWorkHighlights, { server: false })
const { data: bookRecommendation } = useAsyncData(
  'works-page-recommendation',
  () => (user.value ? fetchUnreadRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
)
const { data: ownedUnreadRecommendation } = useAsyncData(
  'works-page-owned-unread-recommendation',
  () => (user.value ? fetchOwnedUnreadRecommendation(user.value.sub) : Promise.resolve(null)),
  { server: false }
)

// Series are catalog content (they only change with a reseed + deploy), so
// they're server-rendered alongside the works on this cached page.
const [{ data: works }, { data: series }] = await Promise.all([
  useAsyncData('works', fetchKingWorks),
  useAsyncData('works-series', fetchAllSeries)
])

const readsCountLabel = (count: number) =>
  `${count} ${count === 1 ? 'read' : 'reads'}`

const seriesOptions = computed(() => [
  { label: 'All works', value: 'all' },
  ...(series.value ?? []).map(one => ({ label: one.name, value: one.id }))
])
const seriesFilter = ref('all')

const selectedSeriesMemberIds = computed(() => {
  const selected = (series.value ?? []).find(one => one.id === seriesFilter.value)
  return selected ? new Set(selected.members.map(member => member.workId)) : null
})

// An alternate text (counts_with_id) shows with its series member, so the
// original Gunslinger stays under Dark Tower next to the Revised Edition.
function extraFilter(work: KingWork) {
  const memberIds = selectedSeriesMemberIds.value
  if (!memberIds) return true
  return memberIds.has(work.id) || (work.counts_with_id !== null && memberIds.has(work.counts_with_id))
}

// Offered once the viewer's own reads have loaded - filtering on an empty
// store would wrongly list every work as unread.
const statusFilter = computed(() =>
  viewerUser.value && userBooksLoaded.value
    ? {
        doneLabel: 'Read',
        notDoneLabel: 'Unread',
        isDone: (work: KingWork) => !!userBooksByWorkId.value[work.id]?.read
      }
    : undefined
)
</script>

<template>
  <BibliographyBrowsePage
    title="Works"
    description="Browse all works by Stephen King."
    detail-path-prefix="/works"
    :items="works ?? []"
    :year-of="(work: KingWork) => Number(work.publish_date.slice(0, 4))"
    :sort-value-of="(work: KingWork) => Date.parse(work.publish_date)"
    :image-src-of="
      (work: KingWork) =>
        work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'M') : null
    "
    :image-alt-of="(work: KingWork) => `${work.title} cover`"
    placeholder-icon="i-lucide-book"
    sort-year-label="Release year"
    :extra-filter="extraFilter"
    :status-filter="statusFilter"
    :note-of="(work: KingWork) => work.remark"
  >
    <template #header-actions>
      <ReportButton
        mode="missing-content"
        content-area="works"
      />
    </template>

    <template #extra-filters>
      <USelect
        v-model="seriesFilter"
        icon="i-lucide-layers"
        :items="seriesOptions"
        aria-label="Series"
        class="w-full sm:w-56"
      />
    </template>

    <template #item-actions="{ item }">
      <BookReadingActions
        :work-id="(item as KingWork).id"
        :work-title="(item as KingWork).title"
        :work-key="(item as KingWork).open_library_work_key"
        :min-edition-year="(item as KingWork).edition_year_min"
        :max-edition-year="(item as KingWork).edition_year_max"
        :publish-date="(item as KingWork).publish_date"
      />
    </template>

    <template #sidebar>
      <HighlightsSkeleton
        v-if="!workHighlights"
        :count="4"
      />
      <template v-else>
        <WorkRecommendation :recommendation="bookRecommendation ?? null" />
        <WorkOwnedRecommendation
          :recommendation="ownedUnreadRecommendation ?? null"
        />
        <WorkLeaderboard
          title="Most Read Books"
          icon="i-lucide-trending-up"
          :items="workHighlights.mostReadBooks"
          :count-label="readsCountLabel"
          empty-message="No books have been marked read yet."
        />
        <WorkSpotlight
          title="Book of the Week"
          icon="i-lucide-sparkles"
          :work="workHighlights.bookOfTheWeek"
          empty-message="No book is featured right now."
        />
        <WorkBirthday :works="workHighlights.bookBirthdays" />
        <WorkLeastReadSpotlight :work="workHighlights.leastReadBook" />
      </template>
    </template>
  </BibliographyBrowsePage>
</template>
