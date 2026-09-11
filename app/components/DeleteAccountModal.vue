<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const supabase = useSupabaseClient()

const deleteConfirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')

watch(open, (isOpen) => {
  if (!isOpen) {
    deleteConfirmText.value = ''
    deleteError.value = ''
  }
})

async function deleteAccount() {
  deleteError.value = ''
  deleting.value = true

  try {
    await $fetch('/api/account', { method: 'DELETE' })
    await supabase.auth.signOut()
    await navigateTo('/')
  } catch {
    deleteError.value = 'Something went wrong deleting your account. Please try again.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Delete account"
  >
    <template #body>
      <p class="text-sm italic text-muted">
        "Go then, there are other apps than these."
      </p>

      <p class="mt-3 text-sm text-muted">
        This permanently deletes your account and all your data. This cannot be undone.
      </p>

      <UFormField
        label="Type &quot;DELETE&quot; to confirm"
        class="mt-4"
      >
        <UInput
          v-model="deleteConfirmText"
          placeholder="DELETE"
        />
      </UFormField>

      <UAlert
        v-if="deleteError"
        color="error"
        variant="subtle"
        :title="deleteError"
        class="mt-3"
      />
    </template>

    <template #footer="{ close }">
      <UButton
        color="error"
        :disabled="deleteConfirmText !== 'DELETE'"
        :loading="deleting"
        @click="deleteAccount"
      >
        Permanently delete
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        @click="close"
      >
        Cancel
      </UButton>
    </template>
  </UModal>
</template>
