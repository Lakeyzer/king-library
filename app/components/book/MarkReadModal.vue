<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import { parseDate } from '@internationalized/date'
import type { ReadFormat } from '~/composables/useBooks'

interface Props {
  workId: string
  workTitle: string
  /** 'king' (default) writes to user_books via useBooks(); 'related' writes to user_related_works via useRelatedWorks() - see reading-status's "Works by Others share the same reading-status controls". Related has no reread-history table (see useRelatedWorks.ts's own note on markRead), so a single markRead call there does the job of King's mark/read-again/finish all at once - `mode` is ignored for domain="related". */
  domain?: 'king' | 'related'
  /** King-only: "again" reuses this same prompt for reading-status's "read again" action on a work already marked read - see design.md "Read-again reuses the mark-read-directly prompt". */
  mode?: 'mark' | 'again'
  /** domain="related" only: prefills this modal to edit an existing read (opened from the reading timeline) or finish an in-progress one (opened from Currently Reading) - a King read is instead edited via BookEditReadDatesModal or finished via BookFinishReadingModal, which don't need these. */
  initialStartedOn?: string | null
  initialFinishedOn?: string | null
  initialNote?: string | null
  initialRating?: number | null
  initialFormat?: ReadFormat | null
  /** domain="related" only: shows a Delete control in the footer for removing this entry entirely, rather than saving changes to it - only meaningful when this instance represents an existing read being edited (the reading timeline's edit flow), not a new one being logged or an in-progress one being finished, so those callers leave it false. */
  allowDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  domain: 'king',
  mode: 'mark',
  initialStartedOn: null,
  initialFinishedOn: null,
  initialNote: null,
  initialRating: null,
  initialFormat: null,
  allowDelete: false
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  logged: []
  /** domain="related" only - lets a caller (e.g. ReadingTimeline's edit flow) patch its own local copy of the entry without refetching, mirroring BookEditReadDatesModal's `saved`. */
  saved: [{ startedOn: string | null, finishedOn: string | null, note: string | null, rating: number | null, format: ReadFormat | null }]
  /** domain="related" only, allowDelete only - mirrors BookEditReadDatesModal's `deleted`. */
  deleted: []
}>()

const { markRead: markReadBook, readAgain } = useBooks()
const { markRead: markReadRelated, unmarkRead: unmarkReadRelated } = useRelatedWorks()
const { fetchUserShortStoryReads } = useShortStories()

const isRelated = computed(() => props.domain === 'related')

function initialDateRange(): { start: DateValue | undefined, end: DateValue | undefined } {
  if (!isRelated.value) return { start: undefined, end: undefined }
  return {
    start: props.initialStartedOn ? parseDate(props.initialStartedOn) : undefined,
    end: props.initialFinishedOn ? parseDate(props.initialFinishedOn) : undefined
  }
}

const dateRange = ref<{ start: DateValue | undefined, end: DateValue | undefined }>(initialDateRange())
const readYear = ref<number | null>(null)
const note = ref(props.initialNote ?? '')
const format = ref<ReadFormat | null>(isRelated.value ? props.initialFormat : null)
const rating = ref<number | null>(props.initialRating ?? null)
const loading = ref(false)
// A second click on "Delete" within DELETE_CONFIRM_WINDOW_MS confirms it -
// see BookEditReadDatesModal's own copy of this pattern for the reasoning.
const DELETE_CONFIRM_WINDOW_MS = 4000
const confirmingDelete = ref(false)
let confirmingDeleteTimeout: ReturnType<typeof setTimeout> | undefined

watch(open, (isOpen) => {
  if (isOpen) {
    dateRange.value = initialDateRange()
    readYear.value = null
    note.value = props.initialNote ?? ''
    format.value = isRelated.value ? props.initialFormat : null
    rating.value = props.initialRating ?? null
    confirmingDelete.value = false
    clearTimeout(confirmingDeleteTimeout)
  }
})

const title = computed(() => (!isRelated.value && props.mode === 'again' ? 'Read Again' : 'Mark as Read'))
const confirmLabel = computed(() => (!isRelated.value && props.mode === 'again' ? 'Log Read' : 'Mark as Read'))

function handleDeleteClick() {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    confirmingDeleteTimeout = setTimeout(() => {
      confirmingDelete.value = false
    }, DELETE_CONFIRM_WINDOW_MS)
    return
  }

  clearTimeout(confirmingDeleteTimeout)
  void deleteEntry()
}

// A related work has no per-read log to delete just one row from (see
// markRead's own note) - deleting its one timeline entry is the same as
// unmarking it as read entirely.
async function deleteEntry() {
  loading.value = true
  try {
    await unmarkReadRelated(props.workId)
    emit('deleted')
    open.value = false
  } finally {
    loading.value = false
  }
}

async function confirm() {
  loading.value = true
  try {
    if (isRelated.value) {
      const details = {
        startedOn: dateRange.value.start?.toString(),
        finishedOn: dateRange.value.end?.toString(),
        note: note.value || undefined,
        rating: rating.value ?? undefined,
        format: format.value ?? undefined
      }
      await markReadRelated(props.workId, details)
      emit('saved', {
        startedOn: details.startedOn ?? null,
        finishedOn: details.finishedOn ?? null,
        note: details.note ?? null,
        rating: details.rating ?? null,
        format: details.format ?? null
      })
    } else {
      const details = {
        startedOn: dateRange.value.start?.toString(),
        finishedOn: dateRange.value.end?.toString(),
        readYear: readYear.value ?? undefined,
        note: note.value || undefined,
        format: format.value ?? undefined,
        rating: rating.value ?? undefined
      }

      if (props.mode === 'again') {
        await readAgain(props.workId, details)
      } else {
        await markReadBook(props.workId, details)
        // Marking a collection read cascades to user_short_story_reads via a DB
        // trigger (see supabase-conventions "cascade_short_story_reads_on_collection_read") -
        // refetch so any short story reading-status controls on screen pick up
        // the newly-created rows instead of still showing unread. Only relevant
        // the first time a work becomes read, not on a "read again" of a work
        // that's already read (the cascade already ran).
        await fetchUserShortStoryReads()
      }
    }
    open.value = false
    emit('logged')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="workTitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          label="Reading dates"
          description="Optional"
        >
          <!--
            Nuxt UI's bundled types declare two nominally distinct (but
            structurally identical) DateValue classes, so a plain v-model
            fails typecheck here even though the runtime values line up -
            cast at this one boundary rather than losing typing on dateRange
            itself, which we still rely on below.
          -->
          <UInputDate
            :model-value="(dateRange as never)"
            range
            @update:model-value="(value) => (dateRange = value as typeof dateRange)"
          />
        </UFormField>
        <UFormField
          v-if="!isRelated"
          label="Year read"
          description="Optional - use if you don't remember exact dates"
        >
          <UInputNumber
            v-model="readYear"
            :min="1900"
            :max="new Date().getFullYear()"
            :format-options="{ useGrouping: false }"
          />
        </UFormField>

        <BookReadDetailsFields
          v-model:note="note"
          v-model:format="format"
          v-model:rating="rating"
        />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        v-if="allowDelete"
        :label="confirmingDelete ? 'Confirm delete?' : 'Delete'"
        icon="i-lucide-trash-2"
        color="error"
        variant="soft"
        class="mr-auto"
        :loading="loading"
        @click="handleDeleteClick"
      />
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        :label="confirmLabel"
        color="primary"
        :loading="loading"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
