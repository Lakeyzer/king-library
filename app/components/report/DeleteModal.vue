<script setup lang="ts">
import type { ReportListEntry } from '~/composables/useReports'

interface Props {
  report: ReportListEntry | null
}

const props = defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ deleted: [] }>()

const { deleteReport } = useReports()

const loading = ref(false)
const errorMessage = ref('')

watch(open, (isOpen) => {
  if (!isOpen) errorMessage.value = ''
})

async function confirmDelete() {
  if (!props.report) return

  loading.value = true
  errorMessage.value = ''

  try {
    await deleteReport(props.report.id)
    open.value = false
    emit('deleted')
  } catch {
    errorMessage.value = 'Could not delete this report. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Delete report"
  >
    <template #body>
      <p class="text-sm text-muted">
        Delete this report? This cannot be undone.
      </p>
      <p
        v-if="report"
        class="text-sm text-muted mt-2 line-clamp-3"
      >
        "<NumberMotif :text="report.description" />"
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
