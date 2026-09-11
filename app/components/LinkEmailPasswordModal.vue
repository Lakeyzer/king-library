<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

type LinkState = { password: string, confirmPassword: string }

const open = defineModel<boolean>('open', { default: false })

const user = useSupabaseUser()
const { linkEmailPassword } = useIdentities()

const state = reactive<LinkState>({ password: '', confirmPassword: '' })
const errorMessage = ref('')
const loading = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    state.password = ''
    state.confirmPassword = ''
    errorMessage.value = ''
    loading.value = false
  }
})

function validate(state: LinkState): FormError[] {
  const errors: FormError[] = []

  if (!state.password || state.password.length < 6) {
    errors.push({ name: 'password', message: 'Password must be at least 6 characters' })
  }

  if (state.confirmPassword !== state.password) {
    errors.push({ name: 'confirmPassword', message: 'Passwords do not match' })
  }

  return errors
}

async function onSubmit(event: FormSubmitEvent<LinkState>) {
  errorMessage.value = ''
  loading.value = true

  try {
    await linkEmailPassword(event.data.password)
    open.value = false
  } catch {
    errorMessage.value = 'Could not link email/password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Link email/password"
  >
    <template #body>
      <UForm
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email">
          <UInput
            :model-value="user?.email"
            disabled
          />
        </UFormField>

        <UFormField
          name="password"
          label="Password"
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="Password"
          />
        </UFormField>

        <UFormField
          name="confirmPassword"
          label="Confirm password"
        >
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="Confirm password"
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          label="Link email/password"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </UModal>
</template>
