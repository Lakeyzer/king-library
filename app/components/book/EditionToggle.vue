<script setup lang="ts">
interface Props {
  workId: string
  editionId: string
  editionTitle: string
  /** 'king' (default) writes to user_book_editions via useBookshelf(); 'related' writes to user_related_work_editions via useRelatedWorkEditions() - see reading-status's "Works by Others share the same reading-status controls". */
  domain?: 'king' | 'related'
}

const props = withDefaults(defineProps<Props>(), {
  domain: 'king'
})

const user = useSupabaseUser()
const bookEditionsApi = useBookshelf()
const relatedEditionsApi = useRelatedWorkEditions()
const { open: openAuthModal } = useAuthModal()

const isRelated = computed(() => props.domain === 'related')
const { isEditionAdded, addEdition, removeEdition } = isRelated.value ? relatedEditionsApi : bookEditionsApi

const added = computed(() => isEditionAdded(props.workId, props.editionId))
const pending = ref(false)

// Available to a signed-out visitor too (not hidden) - opens the sign-in
// modal instead of acting, same as BookReadingActions.
async function toggle() {
  if (!user.value) {
    openAuthModal()
    return
  }
  if (pending.value) return

  pending.value = true
  try {
    if (added.value) {
      await removeEdition(props.workId, props.editionId)
    } else {
      await addEdition(props.workId, { key: props.editionId, title: props.editionTitle })
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UButton
    :icon="added ? 'i-lucide-check' : 'i-lucide-plus'"
    :color="added ? 'success' : 'neutral'"
    :variant="added ? 'solid' : 'soft'"
    size="xs"
    :loading="pending"
    class="shrink-0 rounded-full"
    :aria-label="added ? `Remove ${editionTitle} from your shelf` : `Add ${editionTitle} to your shelf`"
    @click="toggle"
  />
</template>
