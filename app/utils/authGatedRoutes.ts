// Routes that require a signed-in user - shared by the onboarding.global.ts
// middleware (redirects a signed-out visitor who navigates here) and
// AppHeader's sign-out handler (navigates away if signing out leaves the
// visitor stranded on one of these without a navigation ever happening to
// re-run the middleware).
export function isAuthGatedRoute(path: string) {
  // Unlike the other by-username profile routes (Showcase, Read List, Watch
  // List - all viewable by anyone), a compare route always needs "your side"
  // of the comparison, so it requires sign-in the same as the own-shortcut
  // routes below rather than being publicly viewable.
  const isCompareRoute = /^\/profile\/[^/]+\/compare$/.test(path)

  return (
    path === '/profile'
    || path === '/profile/read-list'
    || path === '/profile/watch-list'
    || path === '/settings'
    || path === '/following'
    || path === '/suggestion-box'
    || isCompareRoute
  )
}
