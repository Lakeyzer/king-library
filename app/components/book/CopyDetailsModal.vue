<script setup lang="ts">
import type { CopyDetails } from '~/utils/copyFormat'

export type CopyDetailsTarget
  = | { kind: 'edition', editionRowId: string }
    | { kind: 'work', workId: string }

interface Props {
  /** Which row the details are saved to - an edition tile's user_book_editions row, or an edition-less work's user_books row. */
  target: CopyDetailsTarget
  /** The copy's current details, used to pre-fill the form each time it opens. */
  details: CopyDetails
  /** Shown under the title, so the user knows which copy they're describing. */
  subtitle?: string
  /** "add" right after adding an edition (its details are already stored, so closing is a skip); "edit" from the shelf. */
  mode?: 'add' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  mode: 'edit'
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [details: CopyDetails] }>()

const toast = useToast()
const { updateEditionDetails } = useBookshelf()
const { setCopyDetails } = useBooks()

// A draft, so closing without saving leaves the stored details untouched.
const draft = ref<CopyDetails>({ ...props.details })
watch(open, (isOpen) => {
  if (isOpen) draft.value = { ...props.details }
}, { immediate: true })

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    const details = normalizeCopyDetails(draft.value)
    if (props.target.kind === 'edition') {
      await updateEditionDetails(props.target.editionRowId, details)
    } else {
      await setCopyDetails(props.target.workId, details)
    }
    emit('saved', details)
    open.value = false
  } catch {
    toast.add({ title: 'Could not save copy details', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="mode === 'add' ? 'Added to Shelf' : 'Copy Details'"
    :description="subtitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p
          v-if="mode === 'add'"
          class="text-sm text-muted"
        >
          Tell us a bit more about your copy, or skip this for now - you can always edit it from your shelf.
        </p>
        <BookCopyDetailsFields v-model="draft" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        :label="mode === 'add' ? 'Skip' : 'Cancel'"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        label="Save"
        color="primary"
        :loading="saving"
        :disabled="!hasValidLimitedNumber(draft)"
        @click="save"
      />
    </template>
  </UModal>
</template>
