import type { JwtPayload } from '@supabase/supabase-js'

// The signed-in user, safe to render with on cached public pages.
//
// A cached page (shared/utils/cachedRoutes.ts) is server-rendered with no
// session (server/middleware/stripSessionOnCachedRoutes.ts), but the Supabase
// client plugin restores the session *before* hydration. Rendering straight
// off useSupabaseUser() would then make the first client render disagree with
// the cached HTML (e.g. the header's account menu vs. its sign-in button). So
// on a cached route `user` stays null - and `isReady` false - until hydration
// has finished (plugins/viewerReady.client.ts), and only then becomes the real
// user. Everywhere else it's ready from the start, so nothing changes there.
//
// Use this for anything a template renders differently per viewer. Queries,
// click handlers and other code that doesn't affect the first render can keep
// using useSupabaseUser() directly.
export function useViewer() {
  const supabaseUser = useSupabaseUser()
  const isReady = useState<boolean>('viewer-ready', () => {
    if (import.meta.server) return !isCachedRoute(useRequestURL().pathname)
    // A client-only (ssr: false) page has no server HTML to match, and a
    // client-side navigation isn't hydrating - either way the real user can
    // render straight away.
    const nuxtApp = useNuxtApp()
    return !nuxtApp.payload.serverRendered || !nuxtApp.isHydrating
  })

  const user = computed<JwtPayload | null>(() => (isReady.value ? supabaseUser.value : null))

  return { user, isReady }
}
