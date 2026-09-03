export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { profile, fetchProfile } = useProfile()

  if (!user.value) {
    profile.value = null

    if (to.path === '/profile') {
      return navigateTo({ path: '/', query: { signin: '1' } })
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
