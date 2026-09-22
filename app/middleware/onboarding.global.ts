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
    return navigateTo('/onboarding')
  }

  if (hasUsername && to.path === '/onboarding') {
    return navigateTo('/profile')
  }
})
