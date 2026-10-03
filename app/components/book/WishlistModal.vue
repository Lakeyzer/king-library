<script setup lang="ts">
import type { WishlistItem } from '~/composables/useWishlist'

interface Props {
  workId: string
  workTitle: string
  /** Single-entry edit mode (used from the profile Wishlist tab): the dialog shows only the form for this entry, saving updates it and closes. Null (default) is the full mode - the viewer's entries for the work plus an add form. */
  editItem?: Pick<WishlistItem, 'id' | 'note' | 'tags'> | null
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const { wishlistItemsByWorkId, ownTagSuggestions, addWishlistItem, updateWishlistItem, removeWishlistItem } = useWishlist()

const entries = computed(() => wishlistItemsByWorkId.value[props.workId] ?? [])

// null = no form shown (full mode, with entries to list), 'new' = adding,
// otherwise the id of the entry being edited.
const formTarget = ref<'new' | string | null>(null)
const note = ref('')
const tags = ref<string[]>([])
const tagError = ref<string | null>(null)
// Custom tags created in this session, so the input can label them before
// they've been saved into ownTagSuggestions.
const createdTags = ref<string[]>([])
const saving = ref(false)
const removingId = ref<string | null>(null)

const tagItems = computed(() =>
  [...new Set([...ownTagSuggestions.value, ...createdTags.value, ...tags.value])].map(tag => ({
    label: wishlistTagLabel(tag),
    value: tag
  }))
)

function startForm(target: 'new' | string, item?: Pick<WishlistItem, 'note' | 'tags'>) {
  formTarget.value = target
  note.value = item?.note ?? ''
  tags.value = [...(item?.tags ?? [])]
  tagError.value = null
}

watch(open, (isOpen) => {
  if (!isOpen) return
  createdTags.value = []
  if (props.editItem) startForm(props.editItem.id, props.editItem)
  else if (entries.value.length === 0) startForm('new')
  else formTarget.value = null
}, { immediate: true })

function onCreateTag(input: string) {
  const result = normalizeWishlistTag(input)
  if (!result.ok) {
    tagError.value = result.reason === 'too-long' ? `Tags can be at most ${WISHLIST_TAG_MAX_LENGTH} characters.` : null
    return
  }
  tagError.value = null
  if (tags.value.includes(result.tag)) return
  if (tags.value.length >= WISHLIST_MAX_TAGS) {
    tagError.value = `An entry can have at most ${WISHLIST_MAX_TAGS} tags.`
    return
  }
  if (!ownTagSuggestions.value.includes(result.tag)) createdTags.value.push(result.tag)
  tags.value = [...tags.value, result.tag]
}

const tooManyTags = computed(() => tags.value.length > WISHLIST_MAX_TAGS)
const noteTooLong = computed(() => note.value.length > WISHLIST_NOTE_MAX_LENGTH)

async function save() {
  if (!formTarget.value || tooManyTags.value || noteTooLong.value) return
  saving.value = true
  try {
    const input = { note: note.value, tags: tags.value }
    if (formTarget.value === 'new') {
      await addWishlistItem(props.workId, input)
      toast.add({ title: 'Added to wishlist', description: props.workTitle, color: 'success' })
    } else {
      await updateWishlistItem(formTarget.value, input)
      toast.add({ title: 'Wishlist entry updated', description: props.workTitle, color: 'success' })
    }
    emit('changed')
    if (props.editItem) open.value = false
    else formTarget.value = null
  } catch {
    toast.add({ title: 'Could not save wishlist entry', color: 'error' })
  } finally {
    saving.value = false
  }
}

// No confirm step - an entry is cheap to recreate (see add-wishlist design.md).
async function remove(item: WishlistItem) {
  removingId.value = item.id
  try {
    await removeWishlistItem(item.id, props.workId)
    if (formTarget.value === item.id) formTarget.value = null
    emit('changed')
    toast.add({ title: 'Removed from wishlist', description: props.workTitle })
  } catch {
    toast.add({ title: 'Could not remove wishlist entry', color: 'error' })
  } finally {
    removingId.value = null
  }
}

function cancelForm(close: () => void) {
  // Full mode with entries to go back to: return to the list rather than
  // closing the dialog outright.
  if (!props.editItem && formTarget.value && entries.value.length > 0) formTarget.value = null
  else close()
}

const title = computed(() => (props.editItem ? 'Edit Wishlist Entry' : 'Wishlist'))
const saveLabel = computed(() => (formTarget.value === 'new' ? 'Add to Wishlist' : 'Save'))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="workTitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <ul
          v-if="!editItem && entries.length"
          class="flex flex-col divide-y divide-default rounded-md border border-default"
        >
          <li
            v-for="item in entries"
            :key="item.id"
            class="flex items-start gap-3 p-3"
            :class="{ 'bg-elevated/50': formTarget === item.id }"
          >
            <div class="min-w-0 flex-1">
              <p
                v-if="item.note"
                class="whitespace-pre-line text-sm"
              >
                {{ item.note }}
              </p>
              <p
                v-else
                class="text-sm italic text-muted"
              >
                No note
              </p>
              <div
                v-if="item.tags.length"
                class="mt-2 flex flex-wrap gap-1"
              >
                <UBadge
                  v-for="tag in item.tags"
                  :key="tag"
                  :label="wishlistTagLabel(tag)"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                />
              </div>
            </div>
            <div class="flex shrink-0 gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Edit entry"
                @click="startForm(item.id, item)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Remove entry"
                :loading="removingId === item.id"
                @click="remove(item)"
              />
            </div>
          </li>
        </ul>

        <UButton
          v-if="!editItem && formTarget === null"
          label="Add another entry"
          icon="i-lucide-plus"
          color="neutral"
          variant="soft"
          class="self-start"
          @click="startForm('new')"
        />

        <div
          v-if="formTarget !== null"
          class="flex flex-col gap-4"
        >
          <UFormField
            label="What are you looking for?"
            description="Optional - e.g. which printing, condition, or edition you're hunting for"
            :error="noteTooLong ? `Notes can be at most ${WISHLIST_NOTE_MAX_LENGTH} characters.` : undefined"
          >
            <UTextarea
              v-model="note"
              :maxlength="WISHLIST_NOTE_MAX_LENGTH"
              :rows="3"
              autoresize
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Tags"
            :description="`Pick or type your own - up to ${WISHLIST_MAX_TAGS}`"
            :error="tagError ?? (tooManyTags ? `An entry can have at most ${WISHLIST_MAX_TAGS} tags.` : undefined)"
          >
            <UInputMenu
              v-model="tags"
              :items="tagItems"
              value-key="value"
              multiple
              create-item
              placeholder="Add tags"
              class="w-full"
              @create="onCreateTag"
            />
          </UFormField>
          <p class="text-xs text-muted">
            Wishlist entries are visible to anyone when your profile is public.
          </p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <template v-if="formTarget !== null">
        <UButton
          label="Cancel"
          color="neutral"
          variant="soft"
          @click="cancelForm(close)"
        />
        <UButton
          :label="saveLabel"
          color="primary"
          :loading="saving"
          :disabled="tooManyTags || noteTooLong"
          @click="save"
        />
      </template>
      <UButton
        v-else
        label="Close"
        color="neutral"
        variant="soft"
        @click="close"
      />
    </template>
  </UModal>
</template>
