<script setup lang="ts">
import type { BookshelfEditionItem, BookshelfItem, BookshelfWorkItem } from '~/composables/useBookshelf'
import type { CopyDetails, CopyFormat } from '~/utils/copyFormat'

// useBookshelf()'s items cover King and related works alike - `workKind`
// tells BookshelfTile which detail page to link to (see profile-showcase
// "Bookshelf and reading timeline always include By Other Hands works").
// Kept as aliases so the tile/remove components keep their own names.
export type ProfileBookshelfEditionItem = BookshelfEditionItem
export type ProfileBookshelfWorkItem = BookshelfWorkItem
export type ProfileBookshelfItem = BookshelfItem

interface Props {
  items: ProfileBookshelfItem[]
  isOwner: boolean
}

const props = defineProps<Props>()

function itemKey(item: ProfileBookshelfItem) {
  return item.kind === 'edition' ? item.editionRowId : item.workId
}

// A local, mutable copy of the incoming items - fetchBookshelf() is a
// one-time snapshot (via useAsyncData on the page), not reactive state, so
// a removal needs somewhere to actually take the tile out of view rather
// than leaving a stale, already-deleted row on screen until the next full
// page load. Resynced whenever the prop itself changes (e.g. navigating to
// a different profile).
const localItems = ref<ProfileBookshelfItem[]>([...props.items])
watch(
  () => props.items,
  (next) => {
    localItems.value = [...next]
  }
)

function handleRemoved(item: ProfileBookshelfItem) {
  localItems.value = localItems.value.filter(other => itemKey(other) !== itemKey(item))
}

// Same reasoning as handleRemoved - patch the snapshot so the tile's marks
// (and any active filter) reflect an edit without a reload.
function handleUpdated(item: ProfileBookshelfItem, copyDetails: CopyDetails) {
  localItems.value = localItems.value.map(other =>
    itemKey(other) === itemKey(item) ? { ...other, copyDetails } : other
  )
}

const search = ref('')

// Copy-details filters - see profile-showcase "Bookshelf can be filtered by
// copy details". All of them, and the title search, must match. A missing
// edition/printing number never matches "first" or "later".
type FormatFilter = CopyFormat | 'not-set'
type OrdinalFilter = 'any' | 'first' | 'later'

const formatFilterItems: { label: string, value: FormatFilter, icon: string }[] = [
  ...COPY_FORMAT_OPTIONS,
  { label: 'Not set', value: 'not-set', icon: 'i-lucide-circle-dashed' }
]
const ordinalFilterItems = (noun: string) => [
  { label: 'Any', value: 'any' },
  { label: `First ${noun}`, value: 'first' },
  { label: `Later ${noun}`, value: 'later' }
]
const editionFilterItems = ordinalFilterItems('edition')
const printingFilterItems = ordinalFilterItems('printing')

const formatFilter = ref<FormatFilter[]>([])
const editionFilter = ref<OrdinalFilter>('any')
const printingFilter = ref<OrdinalFilter>('any')
const signedOnly = ref(false)
const dustJacketOnly = ref(false)
const limitedOnly = ref(false)

const activeFilterCount = computed(
  () =>
    (formatFilter.value.length ? 1 : 0)
    + (editionFilter.value !== 'any' ? 1 : 0)
    + (printingFilter.value !== 'any' ? 1 : 0)
    + (signedOnly.value ? 1 : 0)
    + (dustJacketOnly.value ? 1 : 0)
    + (limitedOnly.value ? 1 : 0)
)

function clearFilters() {
  formatFilter.value = []
  editionFilter.value = 'any'
  printingFilter.value = 'any'
  signedOnly.value = false
  dustJacketOnly.value = false
  limitedOnly.value = false
}

function matchesOrdinal(filter: OrdinalFilter, value: number | null) {
  if (filter === 'any') return true
  if (value === null) return false
  return filter === 'first' ? value === 1 : value >= 2
}

function matchesFilters(item: ProfileBookshelfItem) {
  const details = item.copyDetails
  if (formatFilter.value.length && !formatFilter.value.includes(details.copy_format ?? 'not-set')) return false
  if (!matchesOrdinal(editionFilter.value, details.copy_edition)) return false
  if (!matchesOrdinal(printingFilter.value, details.copy_printing)) return false
  if (signedOnly.value && !details.copy_signed) return false
  if (dustJacketOnly.value && !details.copy_dust_jacket) return false
  if (limitedOnly.value && !details.copy_limited) return false
  return true
}

type SortField = 'title' | 'year'
const sortOptions = [
  { label: 'Title', value: 'title' },
  { label: 'Release year', value: 'year' }
]
const sortBy = ref<SortField>('year')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSortDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

const visibleItems = computed(() => {
  const term = search.value.trim().toLowerCase()
  const filtered = localItems.value.filter(
    item => (!term || item.workTitle.toLowerCase().includes(term)) && matchesFilters(item)
  )

  const sorted = [...filtered]
  sorted.sort((a, b) => {
    const cmp
      = sortBy.value === 'title'
        ? a.workTitle.localeCompare(b.workTitle)
        : a.publishDate.localeCompare(b.publishDate)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return sorted
})

// True masonry places each new tile into whichever column is currently
// shortest, which needs real per-column height tracking. CSS multi-column's
// balance-by-total-height algorithm (tried first - see design.md "Bookshelf
// grid") only approximates that, and for a modest tile count it reads as
// column-major and lopsided rather than filling left-to-right. Round-robin
// assignment - tile 1 to column 1, tile 2 to column 2, ..., wrapping back to
// column 1 - gives that expected reading order deterministically, at the
// cost of balancing by tile *count* rather than real height.
const COLUMN_BREAKPOINTS = [
  { minWidth: 1024, columns: 4 }, // lg
  { minWidth: 640, columns: 3 }, // sm
  { minWidth: 0, columns: 2 }
]

const columnCount = ref(2)

function updateColumnCount() {
  columnCount.value = COLUMN_BREAKPOINTS.find(bp => window.innerWidth >= bp.minWidth)?.columns ?? 2
}

onMounted(() => {
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount)
})

// Round-robin: item at flat index i goes to column i % columnCount, which
// is what makes the grid read left-to-right, wrapping to the first column
// on the next row - see the comment above COLUMN_BREAKPOINTS.
function assignToColumns(items: ProfileBookshelfItem[], columnCount: number) {
  const cols: ProfileBookshelfItem[][] = Array.from({ length: columnCount }, () => [])
  items.forEach((item, index) => {
    cols[index % columnCount]!.push(item)
  })
  return cols
}

const columns = computed(() => assignToColumns(visibleItems.value, columnCount.value))

const groupSeries = ref(false)

// Reorders visibleItems so each series' tiles sit at consecutive flat
// indices (sorted by their series reading order, restricted to what's
// actually in visibleItems - see design.md "Grouping applies after the
// active search filter") instead of being scattered across the list by
// sort. Feeding that reordered list through the same assignToColumns as
// the ungrouped view is what keeps a series flowing left-to-right and
// wrapping to the next row, rather than being stacked into one column -
// see design.md "Grouping algorithm lives in Bookshelf.vue".
const groupedOrder = computed(() => {
  const ordered: ProfileBookshelfItem[] = []
  const placedSeriesIds = new Set<string>()

  for (const item of visibleItems.value) {
    if (item.seriesId) {
      if (placedSeriesIds.has(item.seriesId)) continue
      placedSeriesIds.add(item.seriesId)

      const members = visibleItems.value
        .filter(other => other.seriesId === item.seriesId)
        .sort((a, b) => (a.seriesPosition ?? 0) - (b.seriesPosition ?? 0))

      ordered.push(...members)
    } else {
      ordered.push(item)
    }
  }

  return ordered
})

const groupedColumns = computed(() => assignToColumns(groupedOrder.value, columnCount.value))

const displayedColumns = computed(() => (groupSeries.value ? groupedColumns.value : columns.value))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
        <UIcon
          name="i-lucide-library"
          class="size-5"
        />
        Bookshelf
        <span class="text-sm font-normal text-muted">(<NumberMotif :text="localItems.length" />)</span>
      </h2>

      <div
        v-if="localItems.length"
        class="flex flex-wrap items-center gap-2"
      >
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
        <UPopover>
          <UButton
            label="Filters"
            icon="i-lucide-filter"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            <template
              v-if="activeFilterCount"
              #trailing
            >
              <UBadge
                :label="String(activeFilterCount)"
                size="sm"
                class="rounded-full"
              />
            </template>
          </UButton>

          <template #content>
            <div class="flex w-64 flex-col gap-3 p-3">
              <UFormField label="Format">
                <USelectMenu
                  v-model="formatFilter"
                  :items="formatFilterItems"
                  value-key="value"
                  multiple
                  :search-input="false"
                  placeholder="Any format"
                  size="sm"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Edition">
                <USelect
                  v-model="editionFilter"
                  :items="editionFilterItems"
                  size="sm"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Printing">
                <USelect
                  v-model="printingFilter"
                  :items="printingFilterItems"
                  size="sm"
                  class="w-full"
                />
              </UFormField>
              <UCheckbox
                v-model="signedOnly"
                label="Signed only"
              />
              <UCheckbox
                v-model="dustJacketOnly"
                label="Dust jacket only"
              />
              <UCheckbox
                v-model="limitedOnly"
                label="Limited editions only"
              />
              <UButton
                label="Clear filters"
                color="neutral"
                variant="soft"
                size="sm"
                class="self-start"
                :disabled="!activeFilterCount"
                @click="clearFilters"
              />
            </div>
          </template>
        </UPopover>
        <UCheckbox
          v-model="groupSeries"
          label="Group series"
        />
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
        description="No book on the shelf matches your search or filters."
      />

      <div
        v-else
        class="flex gap-4"
      >
        <div
          v-for="(column, index) in displayedColumns"
          :key="index"
          class="flex flex-1 flex-col gap-4"
        >
          <ProfileBookshelfTile
            v-for="item in column"
            :key="itemKey(item)"
            :item="item"
            :is-owner="isOwner"
            @removed="handleRemoved(item)"
            @updated="(details) => handleUpdated(item, details)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
