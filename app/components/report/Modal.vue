<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { ReportContentArea } from '~/composables/useReports'

interface Props {
  mode: 'issue' | 'missing-content'
  contentArea: ReportContentArea
  /** Required when mode is 'issue' - the specific item this report concerns. Unused for 'missing-content'. */
  itemId?: string
}

const props = withDefaults(defineProps<Props>(), {
  itemId: undefined
})

const open = defineModel<boolean>('open', { default: false })

type ReportFormState = { description: string }

const { reportIssue, reportMissingContent } = useReports()
const toast = useToast()

const state = reactive<ReportFormState>({ description: '' })
const errorMessage = ref('')
const loading = ref(false)

const title = computed(() => (props.mode === 'issue' ? 'Report an Issue' : 'Report Missing Content'))
const placeholder = computed(() =>
  props.mode === 'issue' ? 'What\'s wrong with this page?' : 'What\'s missing from this list?'
)

watch(open, (isOpen) => {
  if (!isOpen) {
    state.description = ''
    errorMessage.value = ''
    loading.value = false
  }
})

function validate(state: ReportFormState): FormError[] {
  const errors: FormError[] = []

  if (!state.description.trim()) {
    errors.push({ name: 'description', message: 'Description is required' })
  } else if (state.description.length > REPORT_DESCRIPTION_MAX_LENGTH) {
    errors.push({ name: 'description', message: `Description must be ${REPORT_DESCRIPTION_MAX_LENGTH} characters or fewer` })
  }

  return errors
}

async function onSubmit(event: FormSubmitEvent<ReportFormState>) {
  errorMessage.value = ''
  loading.value = true

  try {
    if (props.mode === 'issue') {
      if (!props.itemId) throw new Error('Missing item reference for an issue report')
      await reportIssue({ contentArea: props.contentArea, itemId: props.itemId, description: event.data.description.trim() })
    } else {
      await reportMissingContent({ contentArea: props.contentArea, description: event.data.description.trim() })
    }

    open.value = false
    toast.add({
      title: 'Thanks for your report!',
      description: 'You can find it, and all other reports, here.',
      icon: 'i-lucide-check',
      actions: [{ label: 'View Reports', color: 'neutral', variant: 'outline', to: '/suggestion-box#reports' }]
    })
  } catch {
    errorMessage.value = 'Could not submit your report. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
  >
    <template #body>
      <UForm
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="description"
          label="Description"
        >
          <UTextarea
            v-model="state.description"
            :placeholder="placeholder"
            :rows="4"
            :maxlength="REPORT_DESCRIPTION_MAX_LENGTH"
            class="w-full"
          />
          <p class="text-xs text-muted mt-1">
            {{ state.description.length }}/{{ REPORT_DESCRIPTION_MAX_LENGTH }}
          </p>
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          label="Submit Report"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </UModal>
</template>
