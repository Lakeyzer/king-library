// Marks useViewer() ready once hydration has finished. `app:suspense:resolve`
// (not `app:mounted`) is the right moment: Nuxt flips isHydrating off right
// before calling it, after every async page component has hydrated, whereas
// `app:mounted` can fire while an awaited page is still hydrating. It also runs
// after every later navigation, where setting an already-true flag is a no-op.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:suspense:resolve', () => {
    nuxtApp.runWithContext(() => {
      useState<boolean>('viewer-ready').value = true
    })
  })
})
