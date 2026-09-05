<script setup lang="ts">
interface Props {
  workKey: string;
  /** "vertical" forces the paginated list view at every width; "auto" (default) shows the horizontal scroller at sm+ and falls back to the paginated list below it. */
  orientation?: "auto" | "vertical";
}

const props = withDefaults(defineProps<Props>(), {
  orientation: "auto",
});

const PAGE_SIZE = 10;
const SCROLL_LOAD_THRESHOLD = 200;

const { fetchEditions } = useOpenLibraryEditions();

const total = ref(0);

// Horizontal (infinite-scroll) state - only rendered when orientation is "auto" (sm+).
const editions = ref<OpenLibraryEdition[]>([]);
const offset = ref(0);
const hasMore = ref(true);
const loading = ref(false);
const query = ref("");
const scrollerRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// Vertical (paginated) state - always rendered, either as the only view
// ("vertical") or as the small-screen fallback ("auto").
const currentPage = ref(1);
const pageEditions = ref<OpenLibraryEdition[]>([]);
const pageLoading = ref(false);

// Fetched client-side after mount rather than as a blocking top-level await:
// this hits Open Library live, and this component sharing the page's
// Suspense boundary would otherwise hold up the whole page/navigation on a
// third-party API call for content that's supplementary, not core.
onMounted(async () => {
  const firstPage = await fetchEditions(props.workKey, 0, PAGE_SIZE);
  total.value = firstPage.total;
  editions.value = firstPage.editions;
  offset.value = firstPage.editions.length;
  hasMore.value = firstPage.hasMore;
  // Page 1 is exactly what was just fetched - no need to fetch it again.
  pageEditions.value = firstPage.editions;

  await nextTick();
  updateScrollState();
});

const filteredEditions = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return editions.value;

  return editions.value.filter(
    (edition) =>
      edition.publisher?.toLowerCase().includes(term)
      || edition.publishYear?.includes(term)
  );
});

async function loadMore() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  const result = await fetchEditions(props.workKey, offset.value, PAGE_SIZE);
  editions.value.push(...result.editions);
  offset.value += result.editions.length;
  hasMore.value = result.hasMore;
  loading.value = false;

  await nextTick();
  updateScrollState();
}

// A search only makes sense against everything, not just what's loaded so
// far, so entering a filter term pulls in the remaining pages up front.
watch(query, (value) => {
  if (value.trim()) loadAll();
});

// Filtering changes the scroller's content width and can leave it scrolled
// past the end of the (now shorter) result set - reset and re-measure.
watch(filteredEditions, () => {
  if (scrollerRef.value) scrollerRef.value.scrollLeft = 0;
  nextTick(updateScrollState);
});

async function loadAll() {
  while (hasMore.value && !loading.value) {
    await loadMore();
  }
}

function updateScrollState() {
  const el = scrollerRef.value;
  if (!el) return;

  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function onScroll() {
  const el = scrollerRef.value;
  if (!el) return;

  updateScrollState();

  const remaining = el.scrollWidth - el.scrollLeft - el.clientWidth;
  if (remaining < SCROLL_LOAD_THRESHOLD) loadMore();
}

function scrollBy(direction: "left" | "right") {
  const el = scrollerRef.value;
  if (!el) return;

  el.scrollBy({ left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
}

async function loadPage(page: number) {
  if (page === 1 && pageEditions.value.length) return;

  pageLoading.value = true;
  const result = await fetchEditions(props.workKey, (page - 1) * PAGE_SIZE, PAGE_SIZE);
  pageEditions.value = result.editions;
  total.value = result.total;
  pageLoading.value = false;
}

watch(currentPage, (page) => loadPage(page));
</script>

<template>
  <div v-if="editions.length || pageEditions.length" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-highlighted">
        Editions
        <span class="font-normal text-muted">({{ total }})</span>
      </h3>

      <UInput
        v-if="orientation === 'auto'"
        v-model="query"
        icon="i-lucide-search"
        placeholder="Filter by year or publisher"
        size="sm"
        class="hidden w-56 sm:block"
      />
    </div>

    <div v-if="orientation === 'auto'" class="hidden items-center gap-2 sm:flex">
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
        <div v-for="edition in filteredEditions" :key="edition.key" class="w-28 shrink-0">
          <ImageThumbnail
            :src="edition.coverId ? getOpenLibraryCoverUrl(edition.coverId, 'M') : null"
            :alt="`${edition.title} cover`"
            placeholder-icon="i-lucide-book"
            size="lg"
          />
          <p class="mt-1 truncate text-center text-xs text-muted">
            <template v-if="edition.publisher || edition.publishYear">
              <span v-if="edition.publisher">{{ edition.publisher }}</span>
              <span v-if="edition.publisher && edition.publishYear"> · </span>
              <span v-if="edition.publishYear">{{ edition.publishYear }}</span>
            </template>
          </p>
        </div>

        <div v-if="hasMore && !query" class="flex h-40 w-20 shrink-0 items-center justify-center">
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
      :class="[orientation === 'auto' && 'sm:hidden', pageLoading && 'opacity-50']"
    >
      <ul class="flex flex-col gap-2">
        <BibliographyListItem
          v-for="edition in pageEditions"
          :key="edition.key"
          :src="edition.coverId ? getOpenLibraryCoverUrl(edition.coverId, 'M') : null"
          :image-alt="`${edition.title} cover`"
          placeholder-icon="i-lucide-book"
          :title="edition.title"
          :release-year="edition.publishYear ? Number(edition.publishYear) : null"
          :type-label="edition.publisher ?? ''"
        />
      </ul>

      <UPagination
        v-if="total > PAGE_SIZE"
        v-model:page="currentPage"
        :total="total"
        :items-per-page="PAGE_SIZE"
        :disabled="pageLoading"
        class="self-center"
      />
    </div>
  </div>
</template>
