<script setup lang="ts">
import type { CopyDetails } from '~/utils/copyFormat'

interface Props {
  workId: string
  editionId: string
  editionTitle: string
  /** Open Library's free-text physical_format for this edition, used to guess the copy's format on add - see inferCopyFormat(). */
  physicalFormat?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  physicalFormat: null
})

// Several root nodes (the button plus its copy-details modal), so the
// caller's positioning classes are bound to the button explicitly.
defineOptions({ inheritAttrs: false })

const user = useSupabaseUser()
// King and related works alike - both record editions in user_book_editions.
const { isEditionAdded, userEditionsByWorkId, userEditionsLoaded, addEdition, removeEdition } = useBookshelf()
const { userBooksByWorkId } = useBooks()

// A placeholder until we know whether this viewer already has the edition -
// never a "+" on one that's on their shelf (page-caching "Content never shows
// a wrong state while loading").
const { isReady: viewerReady } = useViewer()
const isLoading = computed(() => !viewerReady.value || (!!user.value && !userEditionsLoaded.value))
const { open: openAuthModal } = useAuthModal()

const added = computed(() => isEditionAdded(props.workId, props.editionId))
const pending = ref(false)

// The copy-details form shown right after an add - see book-collection
// "Adding an edition offers a copy-details form".
const showDetailsModal = ref(false)
const addedRowId = ref<string | null>(null)
const addedDetails = ref<CopyDetails>({ ...EMPTY_COPY_DETAILS })

// A work's first edition inherits any copy details already recorded for it
// edition-less (so picking the edition doesn't lose them); otherwise the
// format is guessed from Open Library.
function startingDetails(): CopyDetails {
  const hasEditions = (userEditionsByWorkId.value[props.workId]?.size ?? 0) > 0
  const userBook = userBooksByWorkId.value[props.workId]
  if (!hasEditions && userBook?.owned && hasCopyDetails(userBook)) {
    return normalizeCopyDetails(userBook)
  }
  return { ...EMPTY_COPY_DETAILS, copy_format: inferCopyFormat(props.physicalFormat) }
}

// Available to a signed-out visitor too (not hidden) - opens the sign-in
// modal instead of acting, same as BookReadingActions.
async function toggle() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (pending.value) return

  pending.value = true
  try {
    if (added.value) {
      await removeEdition(props.workId, props.editionId)
    } else {
      const details = startingDetails()
      const row = await addEdition(props.workId, { key: props.editionId, title: props.editionTitle }, details)
      addedRowId.value = row.id
      addedDetails.value = details
      showDetailsModal.value = true
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <USkeleton
    v-if="isLoading"
    v-bind="$attrs"
    class="size-6 shrink-0 rounded-full"
  />
  <UButton
    v-else
    v-bind="$attrs"
    :icon="added ? 'i-lucide-check' : 'i-lucide-plus'"
    :color="added ? 'success' : 'neutral'"
    :variant="added ? 'solid' : 'soft'"
    size="xs"
    :loading="pending"
    class="shrink-0 rounded-full"
    :aria-label="added ? `Remove ${editionTitle} from your shelf` : `Add ${editionTitle} to your shelf`"
    @click="toggle"
  />

  <BookCopyDetailsModal
    v-if="addedRowId"
    v-model:open="showDetailsModal"
    :target="{ kind: 'edition', editionRowId: addedRowId }"
    :details="addedDetails"
    :subtitle="editionTitle"
    mode="add"
  />
</template>
