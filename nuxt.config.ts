// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@nuxt/eslint', '@nuxt/ui', '@nuxt/image'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only: never exposed to the client. Used by server/api/tmdb/[mediaType]/[id].get.ts
    // to proxy TMDb detail lookups so the API key never ships to the browser.
    tmdbApiKey: process.env.TMDB_API_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  routeRules: {
    '/': { prerender: true },
    // OAuth code exchange relies on the PKCE code verifier in browser storage,
    // so this route can only run client-side.
    '/confirm': { ssr: false }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Registers the built-in "none" provider so <NuxtImg provider="none"> type-checks.
  // Used for images already pre-sized by their source (Open Library, TMDb) that
  // don't need IPX processing - see app/components/ImageThumbnail.vue.
  image: {
    none: {}
  },

  supabase: {
    // We do our own route gating (see app/middleware/onboarding.global.ts) rather than the
    // module's built-in "redirect to login if signed out" behavior - there is no dedicated
    // /login page, sign-in happens via a modal from anywhere.
    redirect: false,
    redirectOptions: {
      login: '/',
      callback: '/confirm'
    }
  }
})
