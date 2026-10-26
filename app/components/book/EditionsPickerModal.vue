<script setup lang="ts">
import type { CopyDetails } from '~/utils/copyFormat'

interface Props {
  workId: string
  workKey: string
  /** Forwarded to WorkEditionList - see its own doc on minEditionYear/maxEditionYear. */
  minEditionYear?: number | null
  maxEditionYear?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  minEditionYear: null,
  maxEditionYear: null
})
const open = defineModel<boolean>('open', { default: false })

// King and related works alike - both are tracked in user_books and
// user_book_editions.
const { userBooksByWorkId, setOwned, setCopyDetails } = useBooks()
const { userEditionsByWorkId } = useBookshelf()

const isOwned = computed(() => userBooksByWorkId.value[props.workId]?.owned ?? false)
// Ownership becomes edition-driven the moment any edition is added (see
// useBookshelf's addEdition/removeEdition) - this
// generic toggle only makes sense while there's no edition to hang ownership
// off instead, otherwise unchecking it here would desync owned=false from
// still-present edition rows.
const hasEditions = computed(() => (userEditionsByWorkId.value[props.workId]?.size ?? 0) > 0)

function handleOwnedToggle(value: boolean | 'indeterminate') {
  setOwned(props.workId, value === true)
}

// Copy details for the edition-less copy - see book-collection "Edition-less
// ownership accepts copy details". A draft, reset from the stored row
// whenever that changes (including the trigger clearing it on un-own).
const toast = useToast()
const storedCopyDetails = computed<CopyDetails>(() => {
  const userBook = userBooksByWorkId.value[props.workId]
  return userBook ? normalizeCopyDetails(userBook) : { ...EMPTY_COPY_DETAILS }
})
const copyDraft = ref<CopyDetails>({ ...storedCopyDetails.value })
watch(storedCopyDetails, (next) => {
  copyDraft.value = { ...next }
})

const copyDirty = computed(() => JSON.stringify(copyDraft.value) !== JSON.stringify(storedCopyDetails.value))
const savingCopy = ref(false)

async function saveCopyDetails() {
  savingCopy.value = true
  try {
    await setCopyDetails(props.workId, copyDraft.value)
    toast.add({ title: 'Copy details saved', color: 'success' })
  } catch {
    toast.add({ title: 'Could not save copy details', color: 'error' })
  } finally {
    savingCopy.value = false
  }
}

// Deep-links straight into Open Library's add-edition form for this work,
// rather than just its editions listing. See design.md "Open Library 'add a
// missing edition' link target".
const openLibraryAddEditionUrl = computed(
  () => `https://openlibrary.org/books/add?work=/works/${props.workKey}`
)
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add to Shelf"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UCheckbox
          v-if="!hasEditions"
          :model-value="isOwned"
          label="On my shelf"
          description="Just mark it owned, without picking a specific edition"
          @update:model-value="handleOwnedToggle"
        />

        <div
          v-if="!hasEditions && isOwned"
          class="flex flex-col gap-3 rounded-md border border-default p-3"
        >
          <BookCopyDetailsFields v-model="copyDraft" />
          <UButton
            label="Save copy details"
            size="sm"
            class="self-start"
            :disabled="!copyDirty || !hasValidLimitedNumber(copyDraft)"
            :loading="savingCopy"
            @click="saveCopyDetails"
          />
        </div>

        <WorkEditionList
          :work-key="workKey"
          :work-id="workId"
          :min-edition-year="minEditionYear"
          :max-edition-year="maxEditionYear"
          orientation="vertical"
        >
          <template #below-title>
            <div class="text-sm text-muted items-center flex gap-2 flex-wrap">
              <span>Can't find your edition?</span>
              <UButton
                label="Add it on Open Library"
                icon="i-lucide-external-link"
                color="neutral"
                variant="soft"
                size="sm"
                :to="openLibraryAddEditionUrl"
                target="_blank"
                rel="noopener noreferrer"
              />
            </div>
          </template>
        </WorkEditionList>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Done"
        color="neutral"
        variant="soft"
        @click="close"
      />
    </template>
  </UModal>
</template>
