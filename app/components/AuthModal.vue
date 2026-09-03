<script setup lang="ts">
import type { AuthFormField, ButtonProps, FormError, FormSubmitEvent } from '@nuxt/ui'

type AuthMode = 'signin' | 'signup'
type OAuthProvider = 'google' | 'discord'
type AuthFormState = { email: string, password: string }

const { isOpen, close } = useAuthModal()
const supabase = useSupabaseClient()
const { fetchProfile } = useProfile()

const mode = ref<AuthMode>('signin')
const errorMessage = ref('')
const loading = ref(false)

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
  { name: 'password', type: 'password', label: 'Password', placeholder: 'Password', required: true }
]

function validate(state: Partial<AuthFormState>): FormError[] {
  const errors: FormError[] = []

  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required' })
  }

  if (!state.password || state.password.length < 6) {
    errors.push({ name: 'password', message: 'Password must be at least 6 characters' })
  }

  return errors
}

async function signInWithOAuth(provider: OAuthProvider) {
  errorMessage.value = ''

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/confirm` }
  })

  if (error) {
    errorMessage.value = error.message
  }
}

const providers: ButtonProps[] = [
  { label: 'Continue with Google', icon: 'i-simple-icons-google', onClick: () => signInWithOAuth('google') },
  { label: 'Continue with Discord', icon: 'i-simple-icons-discord', onClick: () => signInWithOAuth('discord') }
]

async function handleSubmit(event: FormSubmitEvent<AuthFormState>) {
  errorMessage.value = ''
  loading.value = true

  const { email, password } = event.data
  const { error } = mode.value === 'signup'
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password })

  loading.value = false

  if (error) {
    errorMessage.value = mode.value === 'signin' ? 'Incorrect email or password.' : error.message
    return
  }

  close()

  // Closing the modal doesn't navigate anywhere, so the onboarding route
  // middleware never gets a chance to run - check directly here instead.
  const profile = await fetchProfile()
  if (!profile?.username) {
    await navigateTo('/onboarding')
  }
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  errorMessage.value = ''
}

watch(isOpen, (open) => {
  if (!open) {
    mode.value = 'signin'
    errorMessage.value = ''
    loading.value = false
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="mode === 'signup' ? 'Create an account' : 'Sign in'"
  >
    <template #body>
      <UAuthForm
        :fields="fields"
        :providers="providers"
        :validate="validate"
        :submit="{ label: mode === 'signup' ? 'Sign up' : 'Sign in' }"
        :loading="loading"
        @submit="handleSubmit"
      >
        <template #validation>
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            :title="errorMessage"
          />
        </template>

        <template #footer>
          <p class="text-center text-sm text-muted">
            <template v-if="mode === 'signup'">
              Already have an account?
              <UButton
                variant="link"
                size="sm"
                class="p-0"
                @click="toggleMode"
              >
                Sign in
              </UButton>
            </template>
            <template v-else>
              Don't have an account?
              <UButton
                variant="link"
                size="sm"
                class="p-0"
                @click="toggleMode"
              >
                Sign up
              </UButton>
            </template>
          </p>
        </template>
      </UAuthForm>
    </template>
  </UModal>
</template>
