export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { profile, fetchProfile } = useProfile()

  if (!user.value) {
    profile.value = null

    // Unlike the other by-username profile routes (Showcase, Read List,
    // Watch List - all viewable by anyone), a compare route always needs
    // "your side" of the comparison, so it requires sign-in the same as
    // the own-shortcut routes below rather than being publicly viewable.
    const isCompareRoute = /^\/profile\/[^/]+\/compare$/.test(to.path)

    if (to.path === '/profile' || to.path === '/profile/read-list' || to.path === '/profile/watch-list' || to.path === '/settings' || to.path === '/following' || isCompareRoute) {
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
