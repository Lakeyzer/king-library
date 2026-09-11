<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false })

const { searchTerm, groups, ensureLoaded } = useGlobalSearch()

watch(open, (isOpen) => {
  if (isOpen) {
    ensureLoaded()
  } else {
    searchTerm.value = ""
  }
})

// The "No matches" placeholder items (see useGlobalSearch) are disabled so
// selecting one doesn't close the dialog like a real result would.
function onSelect(item: { disabled?: boolean }) {
  if (item.disabled) return

  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Search"
    description="Search works, short stories, and adaptations"
    :ui="{
      content: 'top-(--ui-header-height) mt-4 translate-y-0 max-h-[calc(100dvh-var(--ui-header-height)-2rem)] sm:max-h-[calc(100dvh-var(--ui-header-height)-4rem)]'
    }"
  >
    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="groups"
        placeholder="Search works, short stories, adaptations..."
        @update:model-value="onSelect"
      />
    </template>
  </UModal>
</template>
