<script setup lang="ts">
import type { ProfileBookshelfItem } from '~/components/profile/Bookshelf.vue'

interface Props {
  item: ProfileBookshelfItem
}

const props = defineProps<Props>()
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ removed: [] }>()

const { removeEdition: removeBookEdition } = useBookshelf()
const { setOwned: setBookOwned } = useBooks()
const { removeEdition: removeRelatedWorkEdition } = useRelatedWorkEditions()
const { setOwned: setRelatedWorkOwned } = useRelatedWorks()

const removing = ref(false)

async function confirmRemove() {
  removing.value = true
  try {
    if (props.item.source === 'king') {
      if (props.item.kind === 'edition') {
        await removeBookEdition(props.item.workId, props.item.editionId)
      } else {
        await setBookOwned(props.item.workId, false)
      }
    } else {
      if (props.item.kind === 'edition') {
        await removeRelatedWorkEdition(props.item.workId, props.item.editionId)
      } else {
        await setRelatedWorkOwned(props.item.workId, false)
      }
    }
    open.value = false
    emit('removed')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Say true?"
  >
    <template #body>
      <p class="text-sm text-muted">
        Remove <strong class="text-highlighted"><NumberMotif :text="item.workTitle" /></strong> from your shelf?
      </p>
      <p class="mt-1 text-xs text-muted">
        <template v-if="item.kind === 'edition'">
          If this is the last edition you have of it, the work will no longer be marked owned.
        </template>
        <template v-else>
          This work will no longer be marked owned.
        </template>
      </p>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        @click="close"
      />
      <UButton
        label="Say thankya"
        color="error"
        :loading="removing"
        @click="confirmRemove"
      />
    </template>
  </UModal>
</template>
