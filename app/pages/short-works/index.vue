<script setup lang="ts">
import type { KingShortStory } from '~/composables/useShortStories'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Short Works',
  description:
    'Browse Stephen King\'s short stories and novellas, see which collections they appear in, and track which ones you\'ve read.'
})

const { fetchShortStories, fetchCollectionsOverview, fetchUserShortStoryReads }
  = useShortStories()
const { fetchUserBooks } = useBooks()

// Not awaited: only affects the read-status/owned indicators shown via
// ShortStoryReadingActions and WorkTile, which update reactively once they
// resolve - same as the adaptations page. Collections are king_works rows,
// so their owned indicator needs userBooksByWorkId, same as any other work
// listing.
useAsyncData('user-short-story-reads', fetchUserShortStoryReads)
useAsyncData('user-books', fetchUserBooks)

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
    :note-of="collectionNoteOf"
  >
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
