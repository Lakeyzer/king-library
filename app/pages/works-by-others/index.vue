<script setup lang="ts">
import type { RelatedWork } from '~/composables/useRelatedWorks'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Works by Others',
  description:
    'Dark Tower comics and graphic novels, companion/reference books, and authorized tie-in novels - material connected to Stephen King\'s work but not written by him.'
})

const { user: viewerUser } = useViewer()

const { fetchRelatedWorks, computeCompletionCount } = useRelatedWorks()
const { userBooksByWorkId, userBooksLoaded, fetchUserBooks } = useBooks()
const { fetchUserEditions } = useBookshelf()

// Browser-only (the page is cached until the next deploy - see the
// page-caching spec): the actions component and the progress sidebar fill
// in once these resolve (see nuxt-conventions "BookReadingActions... need
// their page to pre-fetch status").
const { fetchOwnWishlist } = useWishlist()
useAsyncData('user-books', fetchUserBooks, { server: false })
useAsyncData('user-wishlist', fetchOwnWishlist, { server: false })
useAsyncData('user-editions', fetchUserEditions, { server: false })

const { data: works } = await useAsyncData('related-works', fetchRelatedWorks)

// BibliographyBrowsePage filters/groups on `type` - category fills that
// role here, giving the page's existing type-filter dropdown for free (see
// by-other-hands spec's "By Other Hands works are grouped into three
// fixed categories").
const items = computed(() =>
  (works.value ?? []).map(work => ({ ...work, type: work.category }))
)

const completion = computed(() => computeCompletionCount(works.value ?? []))

// Every comic, Dark Tower or not (e.g. Marvel's The Stand too) - the same
// set as the profile's Graphic Novels figure (fetchRelatedWorkProfileStats),
// wider than dark-tower.vue's Dark-Tower-only comicProgress. Omnibuses are
// left out: marking one read cascades to the comics it collects, which are
// already counted individually.
const graphicNovelCompletion = computed(() =>
  computeCompletionCount(
    (works.value ?? []).filter(work => work.category === 'comic' && !work.is_omnibus)
  )
)

// Offered once the viewer's own reads have loaded - filtering on an empty
// store would wrongly list every work as unread.
const statusFilter = computed(() =>
  viewerUser.value && userBooksLoaded.value
    ? {
        doneLabel: 'Read',
        notDoneLabel: 'Unread',
        isDone: (work: RelatedWork) => !!userBooksByWorkId.value[work.id]?.read
      }
    : undefined
)
</script>

<template>
  <BibliographyBrowsePage
    title="Works by Others"
    description="Comics, companion books, and tie-in novels connected to Stephen King's work but not written by him. None of this counts toward your King reading or collection progress."
    :items="items"
    detail-path-prefix="/works-by-others"
    :year-of="(work: RelatedWork) => work.publish_date ? Number(work.publish_date.slice(0, 4)) : null"
    :image-src-of="
      (work: RelatedWork) => (work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'M') : null)
    "
    :image-alt-of="(work: RelatedWork) => `${work.title} cover`"
    :subtitle-of="(work: RelatedWork) => `By ${work.creator}`"
    placeholder-icon="i-lucide-book-open-check"
    sort-year-label="Publish year"
    :status-filter="statusFilter"
  >
    <template #header-actions>
      <ReportButton
        mode="missing-content"
        content-area="works_by_others"
      />
    </template>

    <template #item-actions="{ item }">
      <BookReadingActions
        :work-id="(item as RelatedWork).id"
        :work-title="(item as RelatedWork).title"
        :work-key="(item as RelatedWork).open_library_work_key"
        :publish-date="(item as RelatedWork).publish_date"
      />
    </template>

    <template
      v-if="viewerUser"
      #sidebar
    >
      <template v-if="!userBooksLoaded">
        <USkeleton
          v-for="index in 2"
          :key="index"
          class="h-16 rounded-lg"
        />
      </template>
      <template v-else>
        <ProfileProgressBar
          label="Works by Others Read"
          icon="i-lucide-feather"
          :count="completion.count"
          :total="completion.total"
          color="info"
        />
        <ProfileProgressBar
          label="Graphic Novels Read"
          icon="i-lucide-book-open-check"
          :count="graphicNovelCompletion.count"
          :total="graphicNovelCompletion.total"
          color="warning"
        />
      </template>
    </template>
  </BibliographyBrowsePage>
</template>
