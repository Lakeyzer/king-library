// Whether a per-viewer store (userBooksByWorkId, wishlistItemsByWorkId, ...)
// holds the *current* user's data yet. Status controls show a loading
// placeholder until it does, rather than presenting an empty store as "not
// read / not owned" (page-caching "Content never shows a wrong state while
// loading"). Records which user the store was last loaded for, so signing in
// as someone else, or out, makes it not-loaded again with no extra bookkeeping;
// a failed fetch never marks it, so the placeholder stays up.
export function useViewerStoreLoaded(key: string) {
  const user = useSupabaseUser()
  const loadedFor = useState<string | null>(`${key}LoadedFor`, () => null)

  const loaded = computed(() => !!user.value && loadedFor.value === user.value.sub)

  const markLoaded = (userId: string) => {
    loadedFor.value = userId
  }

  return { loaded, markLoaded }
}
