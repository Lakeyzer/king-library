<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

type SuggestionFormState = { title: string, body: string }

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ created: [] }>()

const { createSuggestion } = useSuggestions()

const state = reactive<SuggestionFormState>({ title: '', body: '' })
const isAnonymous = ref(false)
const errorMessage = ref('')
const loading = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    state.title = ''
    state.body = ''
    isAnonymous.value = false
    errorMessage.value = ''
    loading.value = false
  }
})

function validate(state: SuggestionFormState): FormError[] {
  const errors: FormError[] = []

  if (!state.title.trim()) {
    errors.push({ name: 'title', message: 'Title is required' })
  } else if (state.title.length > SUGGESTION_TITLE_MAX_LENGTH) {
    errors.push({ name: 'title', message: `Title must be ${SUGGESTION_TITLE_MAX_LENGTH} characters or fewer` })
  }

  if (!state.body.trim()) {
    errors.push({ name: 'body', message: 'Suggestion is required' })
  } else if (state.body.length > SUGGESTION_BODY_MAX_LENGTH) {
    errors.push({ name: 'body', message: `Suggestion must be ${SUGGESTION_BODY_MAX_LENGTH} characters or fewer` })
  }

  return errors
}

async function onSubmit(event: FormSubmitEvent<SuggestionFormState>) {
  errorMessage.value = ''
  loading.value = true

  try {
    await createSuggestion({
      title: event.data.title.trim(),
      body: event.data.body.trim(),
      isAnonymous: isAnonymous.value
    })
    open.value = false
    emit('created')
  } catch {
    errorMessage.value = 'Could not submit your suggestion. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New Suggestion"
  >
    <template #body>
      <p class="text-muted text-sm mb-4">
        Please look through existing suggestions before submitting a new one, to help avoid duplicates.
      </p>

      <UForm
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="title"
          label="Title"
        >
          <UInput
            v-model="state.title"
            placeholder="A short summary of your idea"
            :maxlength="SUGGESTION_TITLE_MAX_LENGTH"
            class="w-full"
          />
          <p class="text-xs text-muted mt-1">
            {{ state.title.length }}/{{ SUGGESTION_TITLE_MAX_LENGTH }}
          </p>
        </UFormField>

        <UFormField
          name="body"
          label="Suggestion"
        >
          <UTextarea
            v-model="state.body"
            placeholder="Describe your idea in more detail"
            :rows="4"
            :maxlength="SUGGESTION_BODY_MAX_LENGTH"
            class="w-full"
          />
          <p class="text-xs text-muted mt-1">
            {{ state.body.length }}/{{ SUGGESTION_BODY_MAX_LENGTH }}
          </p>
        </UFormField>

        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">
              Post anonymously
            </p>
            <p class="text-xs text-muted">
              Your username won't be shown alongside this suggestion.
            </p>
          </div>
          <USwitch v-model="isAnonymous" />
        </div>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          label="Submit Suggestion"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </UModal>
</template>
