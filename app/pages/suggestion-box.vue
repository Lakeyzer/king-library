<script setup lang="ts">
import type { SuggestionSort, SuggestionStatus, SuggestionStatusFilter } from '~/composables/useSuggestions'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Suggestion Box',
  description: 'Share feedback and feature ideas for King Library, and see what others have suggested.'
})

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS: { label: string, value: SuggestionStatusFilter }[] = [
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

const user = useSupabaseUser()
const { fetchSuggestions, updateSuggestionStatus, castVote, isAdmin } = useSuggestions()

const page = ref(1)
// Defaults to "new" per design.md "Status filter defaults to 'new'" - a
// fresh visit surfaces unreviewed suggestions rather than the full history.
const statusFilter = ref<SuggestionStatusFilter>('new')
const sort = ref<SuggestionSort>('newest')
const suggestions = ref<Awaited<ReturnType<typeof fetchSuggestions>>['suggestions']>([])
const total = ref(0)

async function load() {
  const result = await fetchSuggestions({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value, sort: sort.value })
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

async function onVote(id: string, isUpvote: boolean, currentVote: boolean | null) {
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
</script>

<template>
  <div class="py-8">
    <div class="flex items-center justify-between gap-4 mb-2">
      <div>
        <h1 class="text-xl font-semibold">
          Suggestion Box
        </h1>
        <p class="text-muted text-sm mt-1">
          Share feedback and feature ideas, or browse what others have suggested.
        </p>
      </div>

      <UButton
        v-if="user"
        label="New Suggestion"
        icon="i-lucide-plus"
        @click="isCreateModalOpen = true"
      />
    </div>

    <p class="text-muted text-sm mb-6">
      Please look through existing suggestions before submitting a new one, to help avoid duplicates.
    </p>

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

    <SuggestionCreateModal
      v-model:open="isCreateModalOpen"
      @created="onCreated"
    />
  </div>
</template>
