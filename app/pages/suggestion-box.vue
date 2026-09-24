<script setup lang="ts">
import type {
  SuggestionSort,
  SuggestionStatus,
  SuggestionStatusFilter
} from '~/composables/useSuggestions'
import type {
  ReportStatus,
  ReportStatusFilter
} from '~/composables/useReports'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Suggestion Box',
  description:
    'Share feedback and feature ideas for King Library, and see what others have suggested.'
})

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS: {
  label: string
  value: SuggestionStatusFilter
}[] = [
  { label: 'New', value: 'new' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Applied', value: 'applied' },
  { label: 'All', value: 'all' }
]

const SORT_OPTIONS: { label: string, value: SuggestionSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Popular', value: 'popular' }
]

// Reports have no popularity concept to sort by (no voting), so this filter
// list is the same New/Rejected/Applied/All shape as suggestions' status
// filter, just without "Confirmed" - reports only ever move new -> rejected
// or new -> applied, see add-content-reporting's design.md.
const REPORT_STATUS_FILTER_OPTIONS: {
  label: string
  value: ReportStatusFilter
}[] = [
  { label: 'New', value: 'new' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Applied', value: 'applied' },
  { label: 'All', value: 'all' }
]

const user = useSupabaseUser()
const { fetchSuggestions, updateSuggestionStatus, castVote, isAdmin }
  = useSuggestions()
// isAdmin above already covers reports too - both composables compute the
// identical `app_metadata.role === 'admin'` check, so there's no reason to
// pull a second, redundant copy off useReports().
const { fetchReports, updateReportStatus } = useReports()

const page = ref(1)
// Defaults to "new" per design.md "Status filter defaults to 'new'" - a
// fresh visit surfaces unreviewed suggestions rather than the full history.
const statusFilter = ref<SuggestionStatusFilter>('new')
const sort = ref<SuggestionSort>('newest')
const suggestions = ref<
  Awaited<ReturnType<typeof fetchSuggestions>>['suggestions']
>([])
const total = ref(0)

async function load() {
  const result = await fetchSuggestions({
    page: page.value,
    pageSize: PAGE_SIZE,
    status: statusFilter.value,
    sort: sort.value
  })
  suggestions.value = result.suggestions
  total.value = result.total
}

await useAsyncData('suggestion-box', load)

watch(page, load)

watch([statusFilter, sort], () => {
  page.value = 1
  load()
})

const isCreateModalOpen = ref(false)

async function onCreated() {
  page.value = 1
  await load()
}

async function onUpdateStatus(id: string, status: SuggestionStatus) {
  await updateSuggestionStatus(id, status)
  await load()
}

async function onVote(
  id: string,
  isUpvote: boolean,
  currentVote: boolean | null
) {
  await castVote(id, isUpvote, currentVote)
  await load()
}

async function onDeleted() {
  // Deleting the last suggestion on a page beyond the first would otherwise
  // reload into an empty page - step back one page first when that's about
  // to happen.
  if (suggestions.value.length === 1 && page.value > 1) {
    page.value -= 1
    return
  }

  await load()
}

const reportsPage = ref(1)
// Same "surface unreviewed items first" default as the suggestions filter
// above.
const reportsStatusFilter = ref<ReportStatusFilter>('new')
const reports = ref<Awaited<ReturnType<typeof fetchReports>>['reports']>([])
const reportsTotal = ref(0)

async function loadReports() {
  const result = await fetchReports({
    page: reportsPage.value,
    pageSize: PAGE_SIZE,
    status: reportsStatusFilter.value
  })
  reports.value = result.reports
  reportsTotal.value = result.total
}

await useAsyncData('suggestion-box-reports', loadReports)

watch(reportsPage, loadReports)

watch(reportsStatusFilter, () => {
  reportsPage.value = 1
  loadReports()
})

async function onUpdateReportStatus(id: string, status: ReportStatus) {
  await updateReportStatus(id, status)
  await loadReports()
}

async function onReportDeleted() {
  // Same last-item-on-a-later-page adjustment as onDeleted() above.
  if (reports.value.length === 1 && reportsPage.value > 1) {
    reportsPage.value -= 1
    return
  }

  await loadReports()
}
</script>

<template>
  <div class="py-8">
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-mailbox"
            class="text-primary size-5"
          />
          <h1 class="text-xl font-semibold">
            Suggestion Box
          </h1>
        </div>
        <p class="text-muted text-sm mt-1">
          Share feedback and feature ideas, or browse what others have
          suggested.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4 mb-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">Status</span>
        <USelect
          v-model="statusFilter"
          :items="STATUS_FILTER_OPTIONS"
          class="w-40"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">Sort</span>
        <USelect
          v-model="sort"
          :items="SORT_OPTIONS"
          class="w-40"
        />
      </div>

      <UButton
        v-if="user"
        label="New Suggestion"
        icon="i-lucide-plus"
        @click="isCreateModalOpen = true"
      />
    </div>

    <UEmpty
      v-if="!suggestions.length"
      icon="i-lucide-mailbox"
      title="No suggestions yet"
      description="Be the first to share an idea."
    />

    <template v-else>
      <SuggestionList
        :suggestions="suggestions"
        :is-admin="isAdmin"
        @update-status="onUpdateStatus"
        @vote="onVote"
        @deleted="onDeleted"
      />

      <div
        v-if="total > PAGE_SIZE"
        class="flex justify-center mt-6"
      >
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="PAGE_SIZE"
        />
      </div>
    </template>

    <USeparator class="mt-10" />

    <div
      id="reports"
      class="mt-10"
    >
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-flag"
          class="text-primary size-5"
        />
        <h2 class="text-lg font-semibold">
          Reports
        </h2>
      </div>
      <p class="text-muted text-sm mt-1 mb-4">
        Issues and missing-content reports submitted from the bibliography,
        adaptations, and works-by-others pages.
      </p>

      <div class="flex items-center gap-2 mb-4">
        <span class="text-sm text-muted">Status</span>
        <USelect
          v-model="reportsStatusFilter"
          :items="REPORT_STATUS_FILTER_OPTIONS"
          class="w-40"
        />
      </div>

      <UEmpty
        v-if="!reports.length"
        icon="i-lucide-flag"
        title="No reports yet"
        description="Reported issues and missing-content notes will show up here."
      />

      <template v-else>
        <ReportList
          :reports="reports"
          :is-admin="isAdmin"
          @update-status="onUpdateReportStatus"
          @deleted="onReportDeleted"
        />

        <div
          v-if="reportsTotal > PAGE_SIZE"
          class="flex justify-center mt-6"
        >
          <UPagination
            v-model:page="reportsPage"
            :total="reportsTotal"
            :items-per-page="PAGE_SIZE"
          />
        </div>
      </template>
    </div>

    <SuggestionCreateModal
      v-model:open="isCreateModalOpen"
      @created="onCreated"
    />
  </div>
</template>
