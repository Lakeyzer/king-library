<script setup lang="ts">
import type { ConnectionListItem } from '~/components/detail/ConnectionList.vue'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

const {
  fetchRelatedWorkBySlug,
  fetchComponentWorksForOmnibus,
  fetchKingWorksForRelatedWork,
  fetchRelatedWorkStats,
  fetchUserRelatedWorks
} = useRelatedWorks()
const { fetchUserEditions } = useRelatedWorkEditions()

const { data: workData } = await useAsyncData(`works-by-others-${slug}`, () =>
  fetchRelatedWorkBySlug(slug)
)

if (!workData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Work not found' })
}

const work = workData.value

const [{ data: componentWorks }, { data: kingWorks }, { data: stats }] = await Promise.all([
  useAsyncData(`works-by-others-${slug}-components`, () =>
    work.is_omnibus ? fetchComponentWorksForOmnibus(work.id) : Promise.resolve([])
  ),
  useAsyncData(`works-by-others-${slug}-king-works`, () =>
    fetchKingWorksForRelatedWork(work.id)
  ),
  useAsyncData(`works-by-others-${slug}-stats`, () => fetchRelatedWorkStats(work.id))
])

// Not awaited: only affects the actions/edition buttons' displayed state,
// which updates reactively once it resolves - see nuxt-conventions
// "BookReadingActions... need their page to pre-fetch status".
useAsyncData('user-related-works', fetchUserRelatedWorks)
useAsyncData('user-related-work-editions', fetchUserEditions)

const publishYear = computed(() =>
  work.publish_date ? Number(work.publish_date.slice(0, 4)) : null
)

const coverSrc = computed(() =>
  work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'L') : null
)

const categoryLabel = computed(() => formatTypeLabel(work.category))

const componentWorkItems = computed<ConnectionListItem[]>(() =>
  (componentWorks.value ?? []).map(componentWork => ({
    id: componentWork.id,
    title: componentWork.title,
    imageSrc: componentWork.cover_id ? getOpenLibraryCoverUrl(componentWork.cover_id, 'M') : null,
    imageAlt: `${componentWork.title} cover`,
    to: `/works-by-others/${componentWork.slug}`
  }))
)

const kingWorkItems = computed<ConnectionListItem[]>(() =>
  (kingWorks.value ?? []).map(kingWork => ({
    id: kingWork.id,
    title: kingWork.title,
    imageSrc: kingWork.cover_id ? getOpenLibraryCoverUrl(kingWork.cover_id, 'M') : null,
    imageAlt: `${kingWork.title} cover`,
    year: Number(kingWork.publish_date.slice(0, 4)),
    typeLabel: formatTypeLabel(kingWork.type),
    to: `/works/${kingWork.slug}`
  }))
)

const { setPageSeo } = useSeo()
setPageSeo({
  title: work.title,
  description: work.description || work.relation_note || `${work.title} by ${work.creator}.`,
  image: work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'L') : undefined
})
</script>

<template>
  <NuxtLayout name="detail">
    <template #hero>
      <DetailHero
        :image-src="coverSrc"
        :image-alt="`${work.title} cover`"
        image-placeholder-icon="i-lucide-book-open-check"
      >
        <div>
          <h1 class="text-3xl font-bold text-pretty text-highlighted sm:text-4xl">
            <NumberMotif :text="work.title" />
          </h1>
          <p class="mt-1 text-muted text-xs">
            By {{ work.creator }}
          </p>
          <p class="mt-4 text-muted flex gap-4 items-center">
            <NumberMotif
              v-if="publishYear !== null"
              :text="publishYear"
            />
            <span><NumberMotif :text="categoryLabel" /></span>
            <UPopover
              v-if="work.is_omnibus"
              mode="hover"
            >
              <UButton
                icon="i-lucide-info"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="How reading progress works for this omnibus"
              />
              <template #content>
                <p class="max-w-72 p-3 text-sm text-muted">
                  Marking this omnibus read also marks each of its collected
                  comics read. The omnibus itself isn't counted on its own -
                  only the comics inside it are, so you're never credited
                  twice.
                </p>
              </template>
            </UPopover>
          </p>
        </div>

        <p
          v-if="work.relation_note"
          class="text-sm italic text-muted whitespace-pre-line"
        >
          <NumberMotif :text="work.relation_note" />
        </p>

        <p
          v-if="work.description"
          class="whitespace-pre-line"
        >
          <NumberMotif :text="work.description" />
        </p>

        <div class="flex justify-start">
          <ReportButton
            mode="issue"
            content-area="works_by_others"
            :item-id="work.id"
          />
        </div>

        <template
          v-if="componentWorkItems.length"
          #related
        >
          <DetailConnectionList
            heading="Contains"
            :items="componentWorkItems"
          />
        </template>

        <template #actions>
          <BookReadingActions
            domain="related"
            :work-id="work.id"
            :work-title="work.title"
            :work-key="work.open_library_work_key"
            :publish-date="work.publish_date"
            mode="expanded"
          />
        </template>

        <template
          v-if="stats"
          #stats
        >
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-book-open"
              class="size-4"
            />
            <span><strong class="text-highlighted"><NumberMotif :text="stats.currently_reading_count" /></strong> reading</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-bookmark"
              class="size-4"
            />
            <span><strong class="text-highlighted"><NumberMotif :text="stats.want_to_read_count" /></strong> want to read</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-circle-check"
              class="size-4"
            />
            <span><strong class="text-highlighted"><NumberMotif :text="stats.read_count" /></strong> read</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-library"
              class="size-4"
            />
            <span><strong class="text-highlighted"><NumberMotif :text="stats.owner_count" /></strong> owned</span>
          </div>
        </template>
      </DetailHero>
    </template>

    <div class="flex flex-col gap-8">
      <WorkEditionList
        v-if="work.open_library_work_key"
        domain="related"
        :work-key="work.open_library_work_key"
        :work-id="work.id"
      />

      <DetailConnectionList
        heading="Related Works"
        :items="kingWorkItems"
        placeholder-icon="i-lucide-book"
        orientation="horizontal"
        show-caption
      />
    </div>
  </NuxtLayout>
</template>
