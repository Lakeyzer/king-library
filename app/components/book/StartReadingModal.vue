<script setup lang="ts">
import type { ReadFormat } from '~/composables/useBooks'

interface Props {
  workId: string
  workTitle: string
  /** 'king' (default) writes to user_books via useBooks(); 'related' writes to user_related_works via useRelatedWorks() - see reading-status's "Works by Others share the same reading-status controls". */
  domain?: 'king' | 'related'
}

const props = withDefaults(defineProps<Props>(), {
  domain: 'king'
})
const open = defineModel<boolean>('open', { default: false })

const { startReading: startReadingBook } = useBooks()
const { startReading: startReadingRelated } = useRelatedWorks()

const isRelated = computed(() => props.domain === 'related')

const startedOn = ref(todayLocalDate())
const format = ref<ReadFormat | null>(null)
const loading = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    startedOn.value = todayLocalDate()
    format.value = null
  }
})

async function confirm() {
  loading.value = true
  try {
    if (isRelated.value) {
      await startReadingRelated(props.workId, startedOn.value, format.value ?? undefined)
    } else {
      await startReadingBook(props.workId, startedOn.value, format.value ?? undefined)
    }
    open.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Start Reading"
    :description="workTitle"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          label="Start date"
          required
        >
          <UInput
            v-model="startedOn"
            type="date"
          />
        </UFormField>

        <UFormField
          label="Format"
          description="Optional"
        >
          <USelect
            :model-value="format ?? undefined"
            :items="READ_FORMAT_OPTIONS"
            placeholder="Select format"
            class="w-48"
            @update:model-value="(value) => (format = (value as ReadFormat | undefined) ?? null)"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        label="Start Reading"
        color="primary"
        :loading="loading"
        :disabled="!startedOn"
        @click="confirm"
      />
    </template>
  </UModal>
</template>
