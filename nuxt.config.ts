// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@nuxtjs/sitemap', '@vite-pwa/nuxt'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://king-library.com'
  },

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

  pwa: {
    // Installability only - see specs/pwa/spec.md. No offline data access: the service
    // worker below intentionally precaches and runtime-caches nothing, including Supabase.
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    manifest: {
      name: 'King Library',
      short_name: 'King Library',
      display: 'standalone',
      start_url: '/',
      // clay-600 / parchment-50 design tokens (app/assets/css/main.css), resolved to hex.
      theme_color: '#c05b3c',
      background_color: '#f9f9f4',
      // Generated from public/pwa-icon-source.svg via @resvg/resvg-js - used instead
      // of @vite-pwa/assets-generator's default sharp/libvips pipeline, which fails
      // to load its native binary on this machine (ERR_DLOPEN_FAILED).
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      // No app-shell precaching and no runtime caching of any request (Supabase included) -
      // this SW exists only to satisfy browser installability criteria. globPatterns/
      // runtimeCaching alone aren't enough: Nuxt's experimental.appManifest feature force-
      // injects a builds/**/*.json glob into globPatterns regardless of this config, and
      // navigateFallback defaults to "/" (registering an offline SPA-fallback navigation
      // route) unless explicitly disabled. manifestTransforms strips those back out; the
      // one entry it can't reach is manifest.webmanifest itself, which vite-plugin-pwa
      // always precaches as part of the install contract - inert PWA metadata, not app
      // content or Supabase data, so it doesn't count as app-shell caching.
      globPatterns: [],
      runtimeCaching: [],
      navigateFallback: null,
      manifestTransforms: [
        () => ({ manifest: [] })
      ]
    }
  },

  sitemap: {
    // Static pages that need auth (or, for /confirm, only ever exist mid-OAuth-redirect)
    // have no SEO value and are never a link worth sharing - see specs/seo-metadata/spec.md.
    exclude: ['/confirm', '/onboarding', '/settings'],
    // Work/adaptation/short-work detail pages are dynamic routes the crawler can't
    // enumerate on its own - this endpoint supplies their slugs. Public per-user profile
    // pages (/profile/[username]) are deliberately NOT sourced here, so only the static
    // /profile route appears in the sitemap, never an enumerated list of usernames.
    sources: ['/api/__sitemap__/urls']
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
