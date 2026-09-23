<script setup lang="ts">
import type { ReadFormat } from '~/composables/useBooks'

interface Props {
  workId: string
  workTitle: string
  /** 'king' (default) writes to user_books via useBooks(); 'related' writes to user_related_works via useRelatedWorks() - see reading-status's "Works by Others share the same reading-status controls". Used by ProfileCurrentlyReading for both domains, so Finish/Stop Reading behave identically regardless of which kind of work is in progress. */
  domain?: 'king' | 'related'
  /** The format captured when this work's current reading session was started (`user_books.format`/`user_related_works.format`), if any - prefills the field here rather than making the user re-enter what they already told us. */
  initialFormat?: ReadFormat | null
  /** domain="related" only: the session's start date, captured when it began. Related's markRead() nulls out any date not explicitly passed (see its own note - no logged-read history to fall back on), so this has to be threaded back through on submit or a related work's started_on would be silently wiped by finishing it. King doesn't need this - useBooks().finishReading() already preserves the existing started_on server-side. */
  initialStartedOn?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  domain: 'king',
  initialFormat: null,
  initialStartedOn: null
})
const open = defineModel<boolean>('open', { default: false })
// Fired after either action succeeds - lets a caller that keeps its own
// local snapshot of "currently reading" items (e.g. ProfileCurrentlyReading,
// which isn't derived from useBooks()/useRelatedWorks()'s own reactive
// state) know this work is no longer in progress, without needing a full
// refetch. Mirrors BookMarkReadModal's `logged`/`deleted` emits, used the
// same way.
const emit = defineEmits<{ resolved: [] }>()

const { finishReading, stopReading } = useBooks()
const { markRead: markReadRelated, stopReading: stopReadingRelated } = useRelatedWorks()

const isRelated = computed(() => props.domain === 'related')

const finishedOn = ref(todayLocalDate())
const note = ref('')
const format = ref<ReadFormat | null>(props.initialFormat)
const rating = ref<number | null>(null)
const loading = ref(false)
// A second click on "Stop Reading" within STOP_CONFIRM_WINDOW_MS confirms
// it - same two-step gesture as EditReadDatesModal's delete confirmation,
// so abandoning a reading session in progress isn't a single-misclick away.
const STOP_CONFIRM_WINDOW_MS = 4000
const confirmingStop = ref(false)
let confirmingStopTimeout: ReturnType<typeof setTimeout> | undefined

watch(open, (isOpen) => {
  if (isOpen) {
    finishedOn.value = todayLocalDate()
    note.value = ''
    format.value = props.initialFormat
    rating.value = null
    confirmingStop.value = false
    clearTimeout(confirmingStopTimeout)
  }
})

async function confirm() {
  loading.value = true
  try {
    if (isRelated.value) {
      await markReadRelated(props.workId, {
        startedOn: props.initialStartedOn ?? undefined,
        finishedOn: finishedOn.value,
        note: note.value || undefined,
        format: format.value ?? undefined,
        rating: rating.value ?? undefined
      })
    } else {
      await finishReading(props.workId, finishedOn.value, {
        note: note.value || undefined,
        format: format.value ?? undefined,
        rating: rating.value ?? undefined
      })
    }
    // Emit before closing, not after - closing sets `open` to false, which
    // (via the parent's v-model setter, e.g. ProfileCurrentlyReading's
    // showFinishModal) can synchronously null out whatever identified this
    // work there before this event ever reaches it. Listeners need the
    // event while that state still points at this work.
    emit('resolved')
    open.value = false
  } finally {
    loading.value = false
  }
}

function handleStopClick() {
  if (!confirmingStop.value) {
    confirmingStop.value = true
    confirmingStopTimeout = setTimeout(() => {
      confirmingStop.value = false
    }, STOP_CONFIRM_WINDOW_MS)
    return
  }

  clearTimeout(confirmingStopTimeout)
  void confirmStop()
}

async function confirmStop() {
  loading.value = true
  try {
    if (isRelated.value) {
      await stopReadingRelated(props.workId)
    } else {
      await stopReading(props.workId)
    }
    // Same emit-before-close ordering as confirm() above.
    emit('resolved')
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Finished Reading"
    :description="workTitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          label="Finish date"
          required
        >
          <UInput
            v-model="finishedOn"
            type="date"
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
        :label="confirmingStop ? 'Confirm stop?' : 'Stop Reading'"
        icon="i-lucide-circle-x"
        color="error"
        :variant="confirmingStop ? 'solid' : 'soft'"
        class="mr-auto"
        :loading="loading"
        @click="handleStopClick"
      />
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        label="Finished"
        color="primary"
        :loading="loading"
        :disabled="!finishedOn"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
