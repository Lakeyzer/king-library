<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'default' })

const { updateUsername } = useProfile()

const state = reactive({ username: '' })
const errorMessage = ref('')
const loading = ref(false)

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/

function validate(state: { username: string }): FormError[] {
  if (!USERNAME_PATTERN.test(state.username)) {
    return [{ name: 'username', message: '3-24 characters: lowercase letters, numbers, and underscores only.' }]
  }

  return []
}

async function onSubmit(event: FormSubmitEvent<{ username: string }>) {
  errorMessage.value = ''
  loading.value = true

  try {
    await updateUsername(event.data.username)
    await navigateTo('/profile')
  } catch (error) {
    errorMessage.value = (error as { code?: string }).code === '23505'
      ? 'That username is already taken.'
      : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto py-16">
    <h1 class="text-xl font-semibold mb-2">
      Choose a username
    </h1>
    <p class="text-muted mb-6">
      This is how other King Library users will see you.
    </p>

    <UForm
      :state="state"
      :validate="validate"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        name="username"
        label="Username"
      >
        <UInput
          v-model="state.username"
          placeholder="username"
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
        label="Continue"
        block
        :loading="loading"
      />
    </UForm>
  </div>
</template>
