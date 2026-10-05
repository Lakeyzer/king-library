export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { profile, fetchProfile } = useProfile()

  if (!user.value) {
    profile.value = null

    if (isAuthGatedRoute(to.path)) {
      // `next` carries the original destination through the sign-in flow -
      // AuthModal reads it back on successful sign-in (password or OAuth,
      // the latter via /confirm) to return the visitor here instead of
      // stranding them on the homepage. See safeNextPath for why only an
      // internal path is ever accepted back out of it.
      return navigateTo({ path: '/', query: { signin: '1', next: to.fullPath } })
    }

    return
  }

  if (profile.value?.id !== user.value.sub) {
    await fetchProfile()
  }

  const hasUsername = !!profile.value?.username

  if (!hasUsername && to.path !== '/onboarding') {
    // On a cached public page the server rendered with no session, so this
    // redirect only happens in the browser - while that cached HTML is still
    // hydrating. Redirecting mid-hydration makes Vue hydrate the onboarding
    // page against the cached page's markup, which mangles the layout (e.g.
    // the centered container goes full width). Let hydration finish first,
    // then navigate like any client-side route change.
    const nuxtApp = useNuxtApp()
    if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
      nuxtApp.hooks.hookOnce('app:suspense:resolve', () =>
        nuxtApp.runWithContext(() => navigateTo('/onboarding', { replace: true }))
      )
      return
    }

    return navigateTo('/onboarding')
  }

  if (hasUsername && to.path === '/onboarding') {
    return navigateTo('/profile')
  }
})
