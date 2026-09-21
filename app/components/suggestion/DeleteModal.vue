<script setup lang="ts">
import type { SuggestionListEntry } from '~/composables/useSuggestions'

interface Props {
  suggestion: SuggestionListEntry | null
}

const props = defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ deleted: [] }>()

const { deleteSuggestion } = useSuggestions()

const loading = ref(false)
const errorMessage = ref('')

watch(open, (isOpen) => {
  if (!isOpen) errorMessage.value = ''
})

async function confirmDelete() {
  if (!props.suggestion) return

  loading.value = true
  errorMessage.value = ''

  try {
    await deleteSuggestion(props.suggestion.id)
    open.value = false
    emit('deleted')
  } catch {
    errorMessage.value = 'Could not delete this suggestion. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Delete suggestion"
  >
    <template #body>
      <p class="text-sm text-muted">
        Delete "<NumberMotif :text="suggestion?.title ?? ''" />"? This cannot be undone.
      </p>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :title="errorMessage"
        class="mt-3"
      />
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        label="Delete"
        color="error"
        :loading="loading"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>
