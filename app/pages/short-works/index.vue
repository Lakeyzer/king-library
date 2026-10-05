<script setup lang="ts">
import type { KingShortStory } from '~/composables/useShortStories'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Short Works',
  description:
    'Browse Stephen King\'s short stories and novellas, see which collections they appear in, and track which ones you\'ve read.'
})

const { user: viewerUser } = useViewer()

const {
  readShortStoryIds,
  shortStoryReadsLoaded,
  fetchShortStories,
  fetchCollectionsOverview,
  fetchUserShortStoryReads
} = useShortStories()
const { fetchUserBooks } = useBooks()

// Browser-only (the page is cached until the next deploy - see the
// page-caching spec): the read-status/owned indicators shown via
// ShortStoryReadingActions and WorkTile fill in once these resolve.
// Collections are King works rows, so their owned indicator needs
// userBooksByWorkId, same as any other work listing.
useAsyncData('user-short-story-reads', fetchUserShortStoryReads, { server: false })
const { fetchOwnWishlist } = useWishlist()
useAsyncData('user-books', fetchUserBooks, { server: false })
useAsyncData('user-wishlist', fetchOwnWishlist, { server: false })

// Independent fetches, run in parallel rather than one-after-another.
const [{ data: shortStories }, { data: collectionsOverview }]
  = await Promise.all([
    useAsyncData('short-stories', fetchShortStories),
    useAsyncData(
      'short-stories-collections-overview',
      fetchCollectionsOverview
    )
  ])

const notInCollectionOnly = ref(false)

const storyIdsInCollection = computed(
  () => new Set(collectionsOverview.value?.storyIdsInCollection ?? [])
)

function extraFilter(story: KingShortStory) {
  if (notInCollectionOnly.value && storyIdsInCollection.value.has(story.id)) {
    return false
  }
  return true
}

function collectionNoteOf(story: KingShortStory) {
  const titles = collectionsOverview.value?.collectionTitlesByStoryId[story.id]
  return titles?.length ? titles.join(', ') : 'Uncollected'
}

// Offered once the viewer's own reads have loaded - filtering on an empty
// store would wrongly list every story as unread.
const statusFilter = computed(() =>
  viewerUser.value && shortStoryReadsLoaded.value
    ? {
        doneLabel: 'Read',
        notDoneLabel: 'Unread',
        isDone: (story: KingShortStory) => !!readShortStoryIds.value[story.id]
      }
    : undefined
)
</script>

<template>
  <BibliographyBrowsePage
    title="Short Works"
    description="Browse Stephen King's short stories and novellas."
    detail-path-prefix="/short-works"
    :items="shortStories ?? []"
    :year-of="(story: KingShortStory) => story.original_publish_year"
    :image-src-of="() => null"
    :image-alt-of="(story: KingShortStory) => `${story.title} placeholder`"
    placeholder-icon="i-lucide-file-text"
    sort-year-label="Original publish year"
    :extra-filter="extraFilter"
    :status-filter="statusFilter"
    :note-of="collectionNoteOf"
  >
    <template #header-actions>
      <ReportButton
        mode="missing-content"
        content-area="short_works"
      />
    </template>

    <template #extra-filters>
      <UCheckbox
        v-model="notInCollectionOnly"
        label="Not in a collection"
      />
    </template>

    <template #item-actions="{ item }">
      <ShortStoryReadingActions :short-story-id="(item as KingShortStory).id" />
    </template>

    <template
      v-if="collectionsOverview"
      #sidebar
    >
      <ShortStoryCollectionsOverview
        :collections="collectionsOverview.collections"
        :coverage-percent="collectionsOverview.coveragePercent"
      />
    </template>
  </BibliographyBrowsePage>
</template>
