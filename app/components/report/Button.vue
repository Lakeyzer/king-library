<script setup lang="ts">
import type { ReportContentArea } from '~/composables/useReports'

interface Props {
  mode: 'issue' | 'missing-content'
  contentArea: ReportContentArea
  /** Required when mode is 'issue' - the specific item this report concerns. */
  itemId?: string
}

const props = withDefaults(defineProps<Props>(), {
  itemId: undefined
})

const user = useSupabaseUser()
const { open: openAuthModal } = useAuthModal()

const isModalOpen = ref(false)

const label = computed(() =>
  props.mode === 'issue' ? 'Report an Issue' : 'Report Missing Content'
)

// Available to a signed-out visitor too (not hidden) - opens the sign-in
// modal instead of the report form, same pattern as BookReadingActions /
// EditionToggle. See specs/content-reporting/spec.md "Report controls
// require sign-in".
function activate() {
  if (!user.value) {
    openAuthModal()
    return
  }
  isModalOpen.value = true
}
</script>

<template>
  <UButton
    :label="label"
    icon="i-lucide-flag"
    color="neutral"
    variant="link"
    size="sm"
    class="px-0"
    @click="activate"
  />

  <ReportModal
    v-model:open="isModalOpen"
    :mode="mode"
    :content-area="contentArea"
    :item-id="itemId"
  />
</template>
