<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Reset Password',
  description: 'Choose a new password for your King Library account.'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const PASSWORD_MIN_LENGTH = 6
const LINK_TIMEOUT_MS = 8000

const state = reactive({ password: '' })
const errorMessage = ref('')
const loading = ref(false)
const linkError = ref('')
const isRecovery = ref(false)

function parseHashError(): string | undefined {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('error_description') ?? undefined
}

// Deliberately NOT using supabase.auth.onAuthStateChange('PASSWORD_RECOVERY', ...) here -
// the Supabase client plugin parses the recovery link's URL fragment and fires that event
// as soon as the app initializes, which can happen before this page's component has even
// mounted to subscribe, so the event is missed and the page hangs on "Verifying...".
// useSupabaseUser() is a reactive global ref instead of a one-shot event, so watching it
// catches the session regardless of when it was actually established - the same approach
// /confirm.vue already uses for the OAuth/email-confirm redirect for this exact reason.
onMounted(() => {
  const hashError = parseHashError()
  if (hashError) {
    linkError.value = hashError
    return
  }

  if (user.value) {
    isRecovery.value = true
    return
  }

  const stop = watch(user, (value) => {
    if (value) {
      isRecovery.value = true
      stop()
    }
  })

  // Covers visiting this page directly, with no recovery tokens at all - without this,
  // the page would otherwise wait on a session that's never coming.
  setTimeout(() => {
    if (!isRecovery.value) {
      linkError.value = 'This password reset link is invalid or has expired.'
      stop()
    }
  }, LINK_TIMEOUT_MS)
})

function validate(state: { password: string }): FormError[] {
  if (!state.password || state.password.length < PASSWORD_MIN_LENGTH) {
    return [{ name: 'password', message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` }]
  }

  return []
}

async function onSubmit(event: FormSubmitEvent<{ password: string }>) {
  errorMessage.value = ''
  loading.value = true

  const { error } = await supabase.auth.updateUser({ password: event.data.password })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  // The tokens in the URL fragment have done their job - clear them out rather
  // than leave them sitting in the address bar and browser history.
  window.history.replaceState(null, '', window.location.pathname)

  await navigateTo('/')
}
</script>

<template>
  <div class="max-w-sm mx-auto py-16">
    <template v-if="linkError">
      <h1 class="text-xl font-semibold mb-2">
        Link expired
      </h1>
      <p class="text-muted mb-6">
        <NumberMotif :text="linkError" />
      </p>
      <UButton
        to="/"
        block
      >
        Back to home
      </UButton>
    </template>

    <template v-else-if="!isRecovery">
      <p class="text-muted text-center py-16">
        Verifying your reset link…
      </p>
    </template>

    <template v-else>
      <h1 class="text-xl font-semibold mb-2">
        Choose a new password
      </h1>
      <p class="text-muted mb-6">
        Enter a new password for your account.
      </p>

      <UForm
        :state="state"
        :validate="validate"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="password"
          label="New password"
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="Password"
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
          label="Update password"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </div>
</template>
