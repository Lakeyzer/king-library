<script setup lang="ts">
import type { RelatedWork } from '~/composables/useRelatedWorks'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Works by Others',
  description:
    'Dark Tower comics and graphic novels, companion/reference books, and authorized tie-in novels - material connected to Stephen King\'s work but not written by him.'
})

const user = useSupabaseUser()

const { fetchRelatedWorks, fetchUserRelatedWorks, computeCompletionCount } = useRelatedWorks()
const { fetchUserEditions } = useRelatedWorkEditions()

// Not awaited: only affects the actions component's displayed state, which
// updates reactively once it resolves - same pattern as user-books on every
// other browsing page (see nuxt-conventions "BookReadingActions... need
// their page to pre-fetch status").
useAsyncData('user-related-works', fetchUserRelatedWorks)
useAsyncData('user-related-work-editions', fetchUserEditions)

const { data: works } = await useAsyncData('related-works', fetchRelatedWorks)

// BibliographyBrowsePage filters/groups on `type` - category fills that
// role here, giving the page's existing type-filter dropdown for free (see
// by-other-hands spec's "By Other Hands works are grouped into three
// fixed categories").
const items = computed(() =>
  (works.value ?? []).map(work => ({ ...work, type: work.category }))
)

const completion = computed(() => computeCompletionCount(works.value ?? []))
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
  >
    <template #item-actions="{ item }">
      <BookReadingActions
        domain="related"
        :work-id="(item as RelatedWork).id"
        :work-title="(item as RelatedWork).title"
        :work-key="(item as RelatedWork).open_library_work_key"
      />
    </template>

    <template
      v-if="user"
      #sidebar
    >
      <ProfileProgressBar
        label="Works by Others Read"
        icon="i-lucide-feather"
        :count="completion.count"
        :total="completion.total"
        color="info"
      />
    </template>
  </BibliographyBrowsePage>
</template>
