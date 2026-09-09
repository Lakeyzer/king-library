<script setup lang="ts">
import type { BookshelfItem } from "~/composables/useBookshelf";

interface Props {
  items: BookshelfItem[];
  isOwner: boolean;
}

const props = defineProps<Props>();

function itemKey(item: BookshelfItem) {
  return item.kind === "edition" ? item.editionRowId : item.workId;
}

// A local, mutable copy of the incoming items - fetchBookshelf() is a
// one-time snapshot (via useAsyncData on the page), not reactive state, so
// a removal needs somewhere to actually take the tile out of view rather
// than leaving a stale, already-deleted row on screen until the next full
// page load. Resynced whenever the prop itself changes (e.g. navigating to
// a different profile).
const localItems = ref<BookshelfItem[]>([...props.items]);
watch(
  () => props.items,
  (next) => {
    localItems.value = [...next];
  },
);

function handleRemoved(item: BookshelfItem) {
  localItems.value = localItems.value.filter((other) => itemKey(other) !== itemKey(item));
}

const search = ref("");

type SortField = "title" | "year";
const sortOptions = [
  { label: "Title", value: "title" },
  { label: "Release year", value: "year" },
];
const sortBy = ref<SortField>("year");
const sortDir = ref<"asc" | "desc">("asc");

function toggleSortDir() {
  sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
}

const visibleItems = computed(() => {
  const term = search.value.trim().toLowerCase();
  const filtered = term
    ? localItems.value.filter((item) => item.workTitle.toLowerCase().includes(term))
    : localItems.value;

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    const cmp =
      sortBy.value === "title"
        ? a.workTitle.localeCompare(b.workTitle)
        : a.publishDate.localeCompare(b.publishDate);
    return sortDir.value === "asc" ? cmp : -cmp;
  });
  return sorted;
});

// True masonry places each new tile into whichever column is currently
// shortest, which needs real per-column height tracking. CSS multi-column's
// balance-by-total-height algorithm (tried first - see design.md "Bookshelf
// grid") only approximates that, and for a modest tile count it reads as
// column-major and lopsided rather than filling left-to-right. Round-robin
// assignment - tile 1 to column 1, tile 2 to column 2, ..., wrapping back to
// column 1 - gives that expected reading order deterministically, at the
// cost of balancing by tile *count* rather than real height.
const COLUMN_BREAKPOINTS = [
  { minWidth: 1024, columns: 5 }, // lg
  { minWidth: 640, columns: 3 }, // sm
  { minWidth: 0, columns: 2 },
];

const columnCount = ref(2);

function updateColumnCount() {
  columnCount.value = COLUMN_BREAKPOINTS.find((bp) => window.innerWidth >= bp.minWidth)?.columns ?? 2;
}

onMounted(() => {
  updateColumnCount();
  window.addEventListener("resize", updateColumnCount);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateColumnCount);
});

// Round-robin: item at flat index i goes to column i % columnCount, which
// is what makes the grid read left-to-right, wrapping to the first column
// on the next row - see the comment above COLUMN_BREAKPOINTS.
function assignToColumns(items: BookshelfItem[], columnCount: number) {
  const cols: BookshelfItem[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    cols[index % columnCount]!.push(item);
  });
  return cols;
}

const columns = computed(() => assignToColumns(visibleItems.value, columnCount.value));

const groupSeries = ref(false);

// Reorders visibleItems so each series' tiles sit at consecutive flat
// indices (sorted by their series reading order, restricted to what's
// actually in visibleItems - see design.md "Grouping applies after the
// active search filter") instead of being scattered across the list by
// sort. Feeding that reordered list through the same assignToColumns as
// the ungrouped view is what keeps a series flowing left-to-right and
// wrapping to the next row, rather than being stacked into one column -
// see design.md "Grouping algorithm lives in Bookshelf.vue".
const groupedOrder = computed(() => {
  const ordered: BookshelfItem[] = [];
  const placedSeriesIds = new Set<string>();

  for (const item of visibleItems.value) {
    if (item.seriesId) {
      if (placedSeriesIds.has(item.seriesId)) continue;
      placedSeriesIds.add(item.seriesId);

      const members = visibleItems.value
        .filter((other) => other.seriesId === item.seriesId)
        .sort((a, b) => (a.seriesPosition ?? 0) - (b.seriesPosition ?? 0));

      ordered.push(...members);
    } else {
      ordered.push(item);
    }
  }

  return ordered;
});

const groupedColumns = computed(() => assignToColumns(groupedOrder.value, columnCount.value));

const displayedColumns = computed(() => (groupSeries.value ? groupedColumns.value : columns.value));
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
        <UIcon name="i-lucide-library" class="size-5" />
        Bookshelf
        <span class="text-sm font-normal text-muted">({{ localItems.length }})</span>
      </h2>

      <div v-if="localItems.length" class="flex flex-wrap items-center gap-2">
        <UInput
          v-model="search"
          placeholder="Search by title"
          icon="i-lucide-search"
          size="sm"
          class="w-full sm:w-56"
        />
        <div class="flex items-center gap-1">
          <USelect
            v-model="sortBy"
            :items="sortOptions"
            icon="i-lucide-arrow-up-down"
            size="sm"
            class="w-40"
            aria-label="Sort field"
          />
          <UButton
            color="neutral"
            variant="subtle"
            size="sm"
            :icon="sortDir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
            aria-label="Toggle sort direction"
            @click="toggleSortDir"
          />
        </div>
        <UCheckbox v-model="groupSeries" label="Group series" />
      </div>
    </div>

    <UEmpty
      v-if="!localItems.length"
      icon="i-lucide-library"
      title="Nothing on the shelf yet"
      description="Add an edition from a work's page to start building your collection."
    />

    <template v-else>
      <UEmpty
        v-if="!visibleItems.length"
        icon="i-lucide-search-x"
        title="No matches"
        description="No book on your shelf matches that search."
      />

      <div v-else class="flex gap-4">
        <div v-for="(column, index) in displayedColumns" :key="index" class="flex flex-1 flex-col gap-4">
          <ProfileBookshelfTile
            v-for="item in column"
            :key="itemKey(item)"
            :item="item"
            :is-owner="isOwner"
            @removed="handleRemoved(item)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
