<script setup lang="ts">
import type { AuthFormField, ButtonProps, FormError, FormSubmitEvent } from '@nuxt/ui'

type AuthMode = 'signin' | 'signup' | 'forgot-password'
type OAuthProvider = 'google' | 'discord'
type AuthFormState = { email: string, password?: string }

const { isOpen, close } = useAuthModal()
const supabase = useSupabaseClient()
const { fetchProfile } = useProfile()
const route = useRoute()

const mode = ref<AuthMode>('signin')
const errorMessage = ref('')
const infoMessage = ref('')
const loading = ref(false)

const EMAIL_FIELD: AuthFormField = { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true }
const PASSWORD_FIELD: AuthFormField = { name: 'password', type: 'password', label: 'Password', placeholder: 'Password', required: true }

// Forgot-password only collects an email - no account is signed into yet, so there's
// no password to check.
const fields = computed<AuthFormField[]>(() =>
  mode.value === 'forgot-password' ? [EMAIL_FIELD] : [EMAIL_FIELD, PASSWORD_FIELD]
)

function validate(state: Partial<AuthFormState>): FormError[] {
  const errors: FormError[] = []

  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required' })
  }

  if (mode.value !== 'forgot-password' && (!state.password || state.password.length < 6)) {
    errors.push({ name: 'password', message: 'Password must be at least 6 characters' })
  }

  return errors
}

async function signInWithOAuth(provider: OAuthProvider) {
  errorMessage.value = ''

  // Unlike password sign-in (no navigation involved at all - the modal just
  // closes wherever it was opened), OAuth always makes a full round trip
  // through /confirm regardless of where it was started from, so returning
  // to "wherever the visitor was" has to be captured explicitly here, not
  // just forwarded when already present. `route.query.next` wins when set
  // (the onboarding middleware bounced a signed-out visitor to `/` from a
  // page that requires sign-in - that original destination, not `/` itself,
  // is where they should land); otherwise the current page is wherever they
  // opened the modal from, and that's what to return to.
  //
  // Can't pass this via the redirectTo URL - Supabase's own client-side
  // OAuth code-exchange strips query params from this page's URL before
  // /confirm's script runs (see OAUTH_NEXT_PATH_KEY). sessionStorage
  // survives that instead.
  const returnPath = typeof route.query.next === 'string' ? route.query.next : route.fullPath
  sessionStorage.setItem(OAUTH_NEXT_PATH_KEY, returnPath)

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

async function handleForgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  // Don't reveal whether the address has an account - resetPasswordForEmail()
  // doesn't error for an unknown email either, so the message stays the same
  // regardless.
  infoMessage.value = 'Check your email for a link to reset your password.'
}

async function handleSubmit(event: FormSubmitEvent<AuthFormState>) {
  errorMessage.value = ''
  infoMessage.value = ''
  loading.value = true

  const { email, password } = event.data

  if (mode.value === 'forgot-password') {
    await handleForgotPassword(email)
    return
  }

  const { data, error } = mode.value === 'signup'
    ? await supabase.auth.signUp({
        email,
        password: password!,
        options: { emailRedirectTo: `${window.location.origin}/confirm?next=/onboarding` }
      })
    : await supabase.auth.signInWithPassword({ email, password: password! })

  loading.value = false

  if (error) {
    errorMessage.value = mode.value === 'signin' ? 'Incorrect email or password.' : error.message
    return
  }

  // When email confirmation is required, signUp() creates the account but doesn't
  // return a session - navigating to onboarding here would leave the user signed
  // out and unable to save a username. Wait for them to confirm via email instead;
  // the emailRedirectTo above lands them on /confirm, which already knows how to
  // wait for the session and forward them to onboarding once it exists.
  if (mode.value === 'signup' && !data.session) {
    infoMessage.value = 'Check your email to confirm your account, then continue there.'
    return
  }

  close()

  // Closing the modal doesn't navigate anywhere, so the onboarding route
  // middleware never gets a chance to run - check directly here instead.
  const profile = await fetchProfile()
  if (!profile?.username) {
    await navigateTo('/onboarding')
    return
  }

  // `next` is set when the onboarding middleware bounced a signed-out
  // visitor here from a page that requires sign-in - send them back to it
  // rather than stranding them on the homepage. Absent for a plain "Sign in"
  // click on a page that didn't require it, so this is a no-op there.
  if (route.query.next) {
    await navigateTo(safeNextPath(route.query.next))
  }
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  errorMessage.value = ''
  infoMessage.value = ''
}

function showForgotPassword() {
  mode.value = 'forgot-password'
  errorMessage.value = ''
  infoMessage.value = ''
}

function backToSignIn() {
  mode.value = 'signin'
  errorMessage.value = ''
  infoMessage.value = ''
}

watch(isOpen, (open) => {
  if (!open) {
    mode.value = 'signin'
    errorMessage.value = ''
    infoMessage.value = ''
    loading.value = false
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="mode === 'signup' ? 'Create an account' : mode === 'forgot-password' ? 'Reset your password' : 'Sign in'"
  >
    <template #body>
      <UAuthForm
        :fields="fields"
        :providers="mode === 'forgot-password' ? [] : providers"
        :validate="validate"
        :submit="{ label: mode === 'signup' ? 'Sign up' : mode === 'forgot-password' ? 'Send reset link' : 'Sign in' }"
        :loading="loading"
        @submit="handleSubmit"
      >
        <template
          v-if="mode === 'signin'"
          #password-hint
        >
          <UButton
            variant="link"
            size="sm"
            class="p-0"
            @click="showForgotPassword"
          >
            Forgot password?
          </UButton>
        </template>

        <template #validation>
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            :title="errorMessage"
          />
          <UAlert
            v-if="infoMessage"
            color="info"
            variant="subtle"
            :title="infoMessage"
          />
        </template>

        <template #footer>
          <template v-if="mode === 'forgot-password'">
            <p class="text-center text-sm text-muted">
              <UButton
                variant="link"
                size="sm"
                class="p-0"
                @click="backToSignIn"
              >
                Back to sign in
              </UButton>
            </p>
          </template>
          <template v-else>
            <p
              v-if="mode === 'signup'"
              class="text-center text-xs text-muted mb-3"
            >
              By creating an account you accept our
              <NuxtLink
                to="/privacy-policy"
                target="_blank"
                class="text-primary"
              >
                Privacy Policy
              </NuxtLink>.
            </p>

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
        </template>
      </UAuthForm>
    </template>
  </UModal>
</template>
