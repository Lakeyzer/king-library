## Why

King Library is a personal collection-tracking app people will want to open quickly and often from a phone's home screen. The project's non-goals already commit to shipping this as an installable PWA rather than a native app — this change delivers that: a web app manifest, an installable icon set, and a discoverable install entry point, via `@vite-pwa/nuxt`.

## What Changes

- Add `@vite-pwa/nuxt` to the project and configure it to generate a web app manifest (name, short name, theme/background color, icons) and register a minimal service worker sufficient to satisfy browser installability criteria.
- Explicitly disable Workbox's precaching/runtime caching so no app shell assets or Supabase responses are cached offline — installability only, no offline data access, per the project's stated PWA non-goal.
- Add app icon assets (192x192, 512x512, and a maskable variant) for the manifest; no suitable high-resolution icon exists in `public/` today (only `favicon.ico`).
- Add a custom "Install App" entry point in the header (default layout), wired to the `beforeinstallprompt` event, since browsers no longer reliably surface an automatic install banner.
- Hide the install entry point once the app is already running in installed/standalone mode, and on platforms/browsers that never fire `beforeinstallprompt` (e.g. iOS Safari), where it has no effect.

## Capabilities

### New Capabilities
- `pwa`: web app manifest generation, icon assets, minimal non-caching service worker registration, and installability behavior.

### Modified Capabilities
- `app-shell`: header gains a new "Install App" entry point (trailing side, alongside the color mode toggle and auth entry point) that appears only when the app is installable and not already installed.

## Impact

- **Dependencies**: adds `@vite-pwa/nuxt` (and its `vite-plugin-pwa` dependency).
- **Config**: `nuxt.config.ts` gains a `pwa` module block (manifest fields, icons, `injectRegister`/caching strategy disabled).
- **Assets**: new icon files under `public/` (or `app/public/`) for manifest `icons` entries.
- **UI**: `app/layouts/default.vue` (or the header component it renders) gains the install control; no other layouts are affected since only the default layout renders the header's trailing controls per `app-shell`.
- **No backend/Supabase impact**: this is a client-side/build-config change only; no schema, RLS, or query changes.
