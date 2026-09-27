<script setup lang="ts">
import { SUGGESTION_ADMIN_COMMENT_MAX_LENGTH } from '~/composables/useSuggestions'
import type { SuggestionListEntry } from '~/composables/useSuggestions'

interface Props {
  suggestion: SuggestionListEntry
  isAdmin: boolean
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false
})

const emit = defineEmits<{
  // null clears the response.
  save: [comment: string | null]
}>()

// Per-suggestion draft, reset whenever the saved response changes (after a
// save + reload, or someone else's edit showing up on reload).
const draft = ref(props.suggestion.adminComment ?? '')
watch(() => props.suggestion.adminComment, (value) => {
  draft.value = value ?? ''
})

const trimmedDraft = computed(() => draft.value.trim())
const isTooLong = computed(() => draft.value.length > SUGGESTION_ADMIN_COMMENT_MAX_LENGTH)
const isUnchanged = computed(() => trimmedDraft.value === (props.suggestion.adminComment ?? ''))

const updatedAtLabel = computed(() => {
  if (!props.suggestion.adminCommentUpdatedAt) return null

  // Fixed locale so the server- and client-rendered text always match.
  return new Date(props.suggestion.adminCommentUpdatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

function save() {
  if (isTooLong.value || isUnchanged.value) return
  emit('save', trimmedDraft.value || null)
}

function clear() {
  draft.value = ''
  emit('save', null)
}
</script>

<template>
  <div
    v-if="suggestion.adminComment"
    class="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3"
  >
    <div class="flex flex-wrap items-center gap-2 text-xs text-muted mb-1">
      <UIcon
        name="i-lucide-message-square"
        class="text-primary size-4"
      />
      <span class="font-medium text-primary">Admin response</span>
      <span v-if="updatedAtLabel">
        Updated <NumberMotif :text="updatedAtLabel" />
      </span>
    </div>
    <p class="text-sm whitespace-pre-wrap">
      <NumberMotif :text="suggestion.adminComment" />
    </p>
  </div>

  <div
    v-if="isAdmin"
    class="mt-4 flex flex-col gap-2"
  >
    <UFormField
      :label="suggestion.adminComment ? 'Edit admin response' : 'Add admin response'"
      :error="isTooLong ? `Response must be at most ${SUGGESTION_ADMIN_COMMENT_MAX_LENGTH} characters` : undefined"
      :help="`${draft.length}/${SUGGESTION_ADMIN_COMMENT_MAX_LENGTH}`"
    >
      <UTextarea
        v-model="draft"
        :rows="3"
        autoresize
        placeholder="Explain the decision or share an update with the author"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2">
      <UButton
        v-if="suggestion.adminComment"
        label="Clear"
        color="neutral"
        variant="soft"
        size="sm"
        :disabled="saving"
        @click="clear"
      />
      <UButton
        label="Save response"
        color="primary"
        size="sm"
        :loading="saving"
        :disabled="isTooLong || isUnchanged"
        @click="save"
      />
    </div>
  </div>
</template>
