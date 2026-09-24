<script setup lang="ts">
import type { KingWork } from '~/composables/useKingWorks'

interface WorkOption {
  label: string
  id: string
  avatar?: { src: string, alt: string }
}

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ selected: [KingWork] }>()

const { fetchKingWorks } = useKingWorks()

const works = ref<KingWork[]>([])
const loading = ref(false)
const loaded = ref(false)

// Fetched once, lazily, the first time the modal is opened - not on module
// load, since most page visits never open this dialog at all.
watch(open, async (isOpen) => {
  if (!isOpen || loaded.value) return

  loading.value = true
  try {
    works.value = await fetchKingWorks()
    loaded.value = true
  } finally {
    loading.value = false
  }
})

const items = computed<WorkOption[]>(() =>
  works.value.map(work => ({
    label: work.title,
    id: work.id,
    avatar: work.cover_id
      ? { src: getOpenLibraryCoverUrl(work.cover_id, 'S'), alt: `${work.title} cover` }
      : undefined
  }))
)

function handleSelect(workId: string | undefined) {
  if (!workId) return
  const work = works.value.find(candidate => candidate.id === workId)
  if (!work) return

  open.value = false
  emit('selected', work)
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add to Timeline"
    description="Search for a King work to log a read for."
  >
    <template #body>
      <USelectMenu
        :items="items"
        value-key="id"
        :loading="loading"
        placeholder="Search by title..."
        icon="i-lucide-search"
        class="w-full"
        @update:model-value="handleSelect"
      />
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
    </template>
  </UModal>
</template>
