<script setup lang="ts">
interface Props {
  workKey: string
  /** Work id (our DB uuid, distinct from workKey's Open Library key) - needed to record add/remove-to-shelf actions against the right work. */
  workId: string
  /** "vertical" forces the paginated list view at every width; "auto" (default) shows the horizontal scroller at sm+ and falls back to the paginated list below it. */
  orientation?: 'auto' | 'vertical'
  /** 'king' (default) or 'related' - forwarded to BookEditionToggle, see its own domain doc. */
  domain?: 'king' | 'related'
  /** Only show editions published in this year or later - for a king_works row that shares an open_library_work_key with another version of the same book (e.g. a Revised Edition), sourced from king_works.edition_year_min. Null (default) means no lower bound. */
  minEditionYear?: number | null
  /** Only show editions published in this year or earlier - king_works.edition_year_max. Null (default) means no upper bound. */
  maxEditionYear?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'auto',
  domain: 'king',
  minEditionYear: null,
  maxEditionYear: null
})

const PAGE_SIZE = 10
const SCROLL_LOAD_THRESHOLD = 200

const { fetchEditions } = useOpenLibraryEditions()

// True until the first Open Library response lands. The fetch itself is
// deliberately not blocking the page (see the onMounted comment below), but
// that means this component renders nothing at all in the meantime - a
// skeleton the same rough shape as the real content avoids the layout shift
// that pop-in would otherwise cause once the response arrives.
const initialLoading = ref(true)
const SKELETON_COUNT = 5

const total = ref(0)

// Horizontal (infinite-scroll) state - only rendered when orientation is "auto" (sm+).
const editions = ref<OpenLibraryEdition[]>([])
const offset = ref(0)
const hasMore = ref(true)
const loading = ref(false)
const query = ref('')
const scrollerRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Vertical (paginated) state - always rendered, either as the only view
// ("vertical") or as the small-screen fallback ("auto").
const currentPage = ref(1)
const pageEditions = ref<OpenLibraryEdition[]>([])
const pageLoading = ref(false)

// Fetched client-side after mount rather than as a blocking top-level await:
// this hits Open Library live, and this component sharing the page's
// Suspense boundary would otherwise hold up the whole page/navigation on a
// third-party API call for content that's supplementary, not core.
onMounted(async () => {
  const firstPage = await fetchEditions(props.workKey, 0, PAGE_SIZE)
  total.value = firstPage.total
  editions.value = firstPage.editions
  offset.value = firstPage.editions.length
  hasMore.value = firstPage.hasMore
  // Page 1 is exactly what was just fetched - no need to fetch it again.
  pageEditions.value = firstPage.editions
  initialLoading.value = false

  await nextTick()
  updateScrollState()

  // A year restriction applies to every edition regardless of search term,
  // so (unlike the query watcher below) it must force loadAll() right away
  // rather than waiting for the user to type something - otherwise only the
  // first fetched page would ever get filtered.
  if (hasYearFilter.value) loadAll()
})

// Editions without a known publish year are excluded once a year
// restriction is active - an unknown year can't be verified as the right
// text, and showing it under either version risks the exact mislabeling
// edition_year_min/max exists to prevent.
function matchesYearFilter(edition: OpenLibraryEdition): boolean {
  if (props.minEditionYear === null && props.maxEditionYear === null) return true

  const year = edition.publishYear ? Number(edition.publishYear) : null
  if (year === null) return false

  if (props.minEditionYear !== null && year < props.minEditionYear) return false
  if (props.maxEditionYear !== null && year > props.maxEditionYear) return false
  return true
}

const hasYearFilter = computed(() => props.minEditionYear !== null || props.maxEditionYear !== null)

const filteredEditions = computed(() => {
  const term = query.value.trim().toLowerCase()

  return editions.value.filter((edition) => {
    if (!matchesYearFilter(edition)) return false
    if (!term) return true

    return (
      edition.publisher?.toLowerCase().includes(term)
      || edition.publishYear?.includes(term)
    )
  })
})

// A search - or an active year restriction, which must be applied against
// everything loaded the same way a search term is - means vertical
// pagination switches from server-fetched pages to paging over the filtered
// in-memory list (see filteredEditions and the loadAll() calls above/below).
const usesClientFiltering = computed(() => query.value.trim().length > 0 || hasYearFilter.value)

const verticalTotal = computed(() => (usesClientFiltering.value ? filteredEditions.value.length : total.value))

const verticalItems = computed(() => {
  if (!usesClientFiltering.value) return pageEditions.value

  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredEditions.value.slice(start, start + PAGE_SIZE)
})

const verticalLoading = computed(() => (usesClientFiltering.value ? loading.value : pageLoading.value))

async function loadMore() {
  if (loading.value || !hasMore.value) return

  loading.value = true
  const result = await fetchEditions(props.workKey, offset.value, PAGE_SIZE)
  editions.value.push(...result.editions)
  offset.value += result.editions.length
  hasMore.value = result.hasMore
  loading.value = false

  await nextTick()
  updateScrollState()
}

// A search only makes sense against everything, not just what's loaded so
// far, so entering a filter term pulls in the remaining pages up front.
// Resetting to page 1 on every change avoids landing on a page number that
// no longer exists once the (now filtered, or un-filtered again) result set
// changes size.
watch(query, (value) => {
  currentPage.value = 1
  if (value.trim()) loadAll()
})

// Filtering changes the scroller's content width and can leave it scrolled
// past the end of the (now shorter) result set - reset and re-measure.
watch(filteredEditions, () => {
  if (scrollerRef.value) scrollerRef.value.scrollLeft = 0
  nextTick(updateScrollState)
})

async function loadAll() {
  while (hasMore.value && !loading.value) {
    await loadMore()
  }
}

function updateScrollState() {
  const el = scrollerRef.value
  if (!el) return

  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function onScroll() {
  const el = scrollerRef.value
  if (!el) return

  updateScrollState()

  const remaining = el.scrollWidth - el.scrollLeft - el.clientWidth
  if (remaining < SCROLL_LOAD_THRESHOLD) loadMore()
}

function scrollBy(direction: 'left' | 'right') {
  const el = scrollerRef.value
  if (!el) return

  el.scrollBy({ left: direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' })
}

async function loadPage(page: number) {
  if (page === 1 && pageEditions.value.length) return

  pageLoading.value = true
  const result = await fetchEditions(props.workKey, (page - 1) * PAGE_SIZE, PAGE_SIZE)
  pageEditions.value = result.editions
  total.value = result.total
  pageLoading.value = false
}

// While searching, pagination pages over the already-loaded filteredEditions
// in memory instead (see verticalItems) - no fetch needed.
watch(currentPage, (page) => {
  if (!usesClientFiltering.value) loadPage(page)
})

// Full-size cover preview, shared by both orientations - a click on any
// edition's thumbnail (only when it actually has a cover) opens the same
// modal rather than each layout building its own.
const previewCoverId = ref<number | null>(null)
const previewTitle = ref('')
const showPreview = ref(false)

function openPreview(edition: OpenLibraryEdition) {
  if (!edition.coverId) return

  previewCoverId.value = edition.coverId
  previewTitle.value = edition.title
  showPreview.value = true
}

const previewSrc = computed(() =>
  previewCoverId.value ? getOpenLibraryCoverUrl(previewCoverId.value, 'L') : null
)

// The vertical layout is shared by two different contexts that want
// different densities: forced ("vertical") is the editions picker modal,
// a dedicated picker where compactness helps scanning many rows, so it
// stays small (xs); the on-page small-screen fallback of "auto" should
// instead match the rest of the detail page's connection lists (e.g.
// DetailConnectionList's own mobile fallback, ImageThumbnail's default
// "sm" size) rather than looking oddly cramped next to them.
const rowThumbnailSize = computed(() => (props.orientation === 'vertical' ? 'xs' : 'sm'))
const rowCoverSize = computed(() => (props.orientation === 'vertical' ? 'S' : 'M'))

// e.g. "Mass Market Paperback in English - 1st Signet printing" - each piece
// is independently optional, so the pieces present decide the shape rather
// than a fixed template.
function formatEditionMeta(edition: OpenLibraryEdition): string | null {
  const formatAndLanguage = [edition.physicalFormat, edition.language && `in ${edition.language}`]
    .filter(Boolean)
    .join(' ')

  const combined = [formatAndLanguage, edition.editionName].filter(Boolean).join(' - ')
  if (!combined) return null

  return combined.charAt(0).toUpperCase() + combined.slice(1)
}
</script>

<template>
  <div
    v-if="initialLoading"
    class="flex flex-col gap-3"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="heading-2">
        Editions
      </h2>
      <USkeleton class="h-9 w-full sm:w-56" />
    </div>

    <div
      v-if="orientation === 'auto'"
      class="hidden items-center gap-2 sm:flex"
    >
      <USkeleton class="size-9 shrink-0 rounded-full" />

      <div class="flex flex-1 gap-3 overflow-hidden">
        <div
          v-for="n in SKELETON_COUNT"
          :key="n"
          class="flex w-28 shrink-0 flex-col gap-1"
        >
          <USkeleton class="h-40 w-28" />
          <USkeleton class="h-3 w-16 self-center" />
        </div>
      </div>

      <USkeleton class="size-9 shrink-0 rounded-full" />
    </div>

    <div
      class="flex flex-col divide-y divide-accented"
      :class="orientation === 'auto' && 'sm:hidden'"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="flex items-center gap-3 py-2"
      >
        <USkeleton
          :class="orientation === 'vertical' ? 'h-10 w-7' : 'h-24 w-15'"
          class="shrink-0"
        />
        <div class="flex flex-1 flex-col gap-2">
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="editions.length || pageEditions.length"
    class="flex flex-col gap-3"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="heading-2">
        Editions
        <span class="font-normal text-muted">(<NumberMotif :text="verticalTotal" />)</span>
      </h2>

      <UInput
        v-model="query"
        icon="i-lucide-search"
        placeholder="Filter by year or publisher"
        size="sm"
        class="w-full sm:w-56"
      />
    </div>

    <slot name="below-title" />

    <div
      v-if="orientation === 'auto'"
      class="hidden items-center gap-2 sm:flex"
    >
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="soft"
        class="shrink-0 rounded-full"
        :disabled="!canScrollLeft"
        aria-label="Scroll left"
        @click="scrollBy('left')"
      />

      <div
        ref="scrollerRef"
        class="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1 scrollbar-none"
        @scroll="onScroll"
      >
        <div
          v-for="edition in filteredEditions"
          :key="edition.key"
          class="w-28 shrink-0"
        >
          <div class="relative">
            <button
              type="button"
              class="block w-full"
              :class="edition.coverId ? 'cursor-zoom-in' : 'cursor-default'"
              :aria-label="`View ${edition.title} cover full size`"
              @click="openPreview(edition)"
            >
              <ImageThumbnail
                :src="edition.coverId ? getOpenLibraryCoverUrl(edition.coverId, 'M') : null"
                :alt="`${edition.title} cover`"
                placeholder-icon="i-lucide-book"
                size="lg"
              />
            </button>
            <BookEditionToggle
              :work-id="workId"
              :edition-id="edition.key"
              :edition-title="edition.title"
              :domain="domain"
              class="absolute right-1 top-1"
            />
          </div>
          <p class="mt-1 truncate text-center text-xs text-muted">
            <template v-if="edition.publisher || edition.publishYear">
              <span v-if="edition.publishYear"><NumberMotif :text="edition.publishYear" /></span>
              <span v-if="edition.publisher && edition.publishYear"> · </span>
              <span v-if="edition.publisher"><NumberMotif :text="edition.publisher" /></span>
            </template>
          </p>
        </div>

        <div
          v-if="hasMore && !usesClientFiltering"
          class="flex h-40 w-20 shrink-0 items-center justify-center"
        >
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            size="lg"
            :loading="loading"
            class="rounded-full"
            aria-label="Load more editions"
            @click="loadMore"
          />
        </div>
      </div>

      <UButton
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="soft"
        class="shrink-0 rounded-full"
        :disabled="!canScrollRight"
        aria-label="Scroll right"
        @click="scrollBy('right')"
      />
    </div>

    <div
      class="flex flex-col gap-3"
      :class="[orientation === 'auto' && 'sm:hidden', verticalLoading && 'opacity-50']"
    >
      <ul class="flex flex-col divide-y divide-accented">
        <li
          v-for="edition in verticalItems"
          :key="edition.key"
          class="flex items-center gap-3 py-2"
        >
          <button
            type="button"
            class="shrink-0"
            :class="edition.coverId ? 'cursor-zoom-in' : 'cursor-default'"
            :aria-label="`View ${edition.title} cover full size`"
            @click="openPreview(edition)"
          >
            <ImageThumbnail
              :src="edition.coverId ? getOpenLibraryCoverUrl(edition.coverId, rowCoverSize) : null"
              :alt="`${edition.title} cover`"
              placeholder-icon="i-lucide-book"
              :size="rowThumbnailSize"
            />
          </button>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">
              <NumberMotif :text="edition.title" />
            </p>
            <p class="truncate text-xs text-muted">
              <template v-if="edition.publisher || edition.publishYear">
                <span v-if="edition.publisher"><NumberMotif :text="edition.publisher" /></span>
                <span v-if="edition.publisher && edition.publishYear"> · </span>
                <span v-if="edition.publishYear"><NumberMotif :text="edition.publishYear" /></span>
              </template>
            </p>
            <p
              v-if="formatEditionMeta(edition)"
              class="truncate text-xs text-muted"
            >
              <NumberMotif :text="formatEditionMeta(edition)!" />
            </p>
          </div>

          <BookEditionToggle
            :work-id="workId"
            :edition-id="edition.key"
            :edition-title="edition.title"
            :domain="domain"
            class="shrink-0"
          />
        </li>
      </ul>

      <UPagination
        v-if="verticalTotal > PAGE_SIZE"
        v-model:page="currentPage"
        :total="verticalTotal"
        :items-per-page="PAGE_SIZE"
        :disabled="verticalLoading"
        class="self-center"
      />
    </div>
  </div>

  <UModal
    v-model:open="showPreview"
    :title="previewTitle"
  >
    <template #body>
      <img
        v-if="previewSrc"
        :src="previewSrc"
        :alt="`${previewTitle} cover`"
        class="mx-auto max-h-[75vh] w-auto rounded"
      >
    </template>
  </UModal>
</template>
