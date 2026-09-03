<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const route = useRoute()

const oauthError = (route.query.error_description ?? route.query.error) as string | undefined

// Only accept an internal, single-leading-slash path - never a full URL - so a crafted
// ?next= query param can't be used to redirect a signed-in visitor off-site.
function safeNextPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

const nextPath = safeNextPath(route.query.next)

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
