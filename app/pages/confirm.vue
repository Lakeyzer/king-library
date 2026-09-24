<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const route = useRoute()

const oauthError = (route.query.error_description ?? route.query.error) as string | undefined

// Prefer the OAuth-flow value stashed in sessionStorage (see
// OAUTH_NEXT_PATH_KEY - the URL's own `next` param, if this page was
// reached via OAuth, has already been stripped by Supabase's client-side
// code-exchange by the time this runs). Falls back to the URL's `next` for
// the email-confirmation flow, which never goes through that stripping.
const storedNextPath = sessionStorage.getItem(OAUTH_NEXT_PATH_KEY)
sessionStorage.removeItem(OAUTH_NEXT_PATH_KEY)

const nextPath = safeNextPath(storedNextPath ?? route.query.next)

if (!oauthError) {
  if (user.value) {
    navigateTo(nextPath)
  } else {
    const stop = watch(user, (value) => {
      if (value) {
        stop()
        navigateTo(nextPath)
      }
    })
  }
}
</script>

<template>
  <div class="py-16 text-center">
    <template v-if="oauthError">
      <p class="text-lg font-medium">
        Sign-in failed
      </p>
      <p class="text-muted mt-2">
        {{ oauthError }}
      </p>
      <UButton
        to="/"
        class="mt-6"
      >
        Back to home
      </UButton>
    </template>
    <template v-else>
      <p class="text-muted">
        Signing you in…
      </p>
    </template>
  </div>
</template>
