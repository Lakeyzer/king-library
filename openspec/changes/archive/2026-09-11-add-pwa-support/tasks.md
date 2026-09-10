## 1. Dependency setup

- [x] 1.1 Add `@vite-pwa/nuxt` as a dependency via `pnpm add @vite-pwa/nuxt` and verify it appears in `package.json` and installs cleanly
- [x] 1.2 Register the module in `nuxt.config.ts`'s `modules` array and verify `pnpm build` succeeds with the module enabled (even before further config)

## 2. Manifest and icons

- [x] 2.1 Source or create a square (≥512x512) app icon image and place it under `public/` (or wherever `@vite-pwa/assets-generator` expects its source); verify the file exists and opens as a valid image
- [x] 2.2 Run the icon generator to produce the 192x192, 512x512, and maskable icon variants, and verify the generated files are written to `public/`
- [x] 2.3 Configure the `pwa.manifest` block in `nuxt.config.ts` (name: "King Library", short_name, `display: 'standalone'`, `start_url`, `theme_color` resolved from the `clay-600` token, `background_color` resolved from the `parchment-50` token, and the generated `icons` array); verify by building and inspecting the emitted `manifest.webmanifest` for all required fields
- [x] 2.4 Verify in a Chromium-based browser's DevTools Application panel (against a `pnpm build && pnpm preview` build) that the manifest is detected with no installability warnings

## 3. Non-caching service worker

- [x] 3.1 Configure `pwa.strategies: 'generateSW'` with `pwa.registerType: 'autoUpdate'` and explicit empty `workbox.globPatterns: []` / `workbox.runtimeCaching: []` in `nuxt.config.ts`; verify by building and inspecting the generated service worker file for an empty precache manifest
- [x] 3.2 Verify, via DevTools Application → Service Workers (against a `pnpm build && pnpm preview` build), that a service worker registers for the app's origin
- [x] 3.3 Verify, via DevTools Network panel with the service worker active, that a Supabase request (e.g. loading any page that reads user/book data) shows as served by the network, not by the service worker, and that no Supabase URL appears in the Application → Cache Storage panel

## 4. Install availability composable

- [x] 4.1 Create `composables/usePwaInstall.ts` that captures the `beforeinstallprompt` event (calling `preventDefault()` and storing it), exposes reactive `canInstall` and `isInstalled` state, and exposes a `promptInstall()` method that calls `.prompt()` on the stored event when available and no-ops otherwise
- [x] 4.2 Implement `isInstalled` detection via `window.matchMedia('(display-mode: standalone)').matches` (checked on mount and kept in sync with the media query's `change` event) plus `navigator.standalone` for iOS Safari; verify by manually toggling `display-mode` in DevTools device emulation and confirming the reactive value flips
- [x] 4.3 Verify `canInstall` clears back to `false` after `promptInstall()` is called (matching the spec's "unavailable once triggered or dismissed" requirement) via a manual test in a browser that supports `beforeinstallprompt`

## 5. Header install control

- [x] 5.1 Add an "Install App" control to the header (default layout), on the trailing side alongside the color mode toggle, using `usePwaInstall`'s `canInstall` to control its `v-if` visibility and `promptInstall()` as its click handler
- [x] 5.2 Verify the control is absent on initial load before `beforeinstallprompt` fires, appears once it fires (Chromium desktop/Android), and disappears again after being clicked or after the app is installed
- [x] 5.3 Verify the control never renders when the app is already running in standalone/installed mode, and never renders in a browser that doesn't support `beforeinstallprompt` (e.g. Firefox or iOS Safari), per the `app-shell` delta spec

## 6. End-to-end verification

- [x] 6.1 Run `pnpm lint` and `pnpm typecheck` and verify both pass with no new errors
- [x] 6.2 From a `pnpm build && pnpm preview` build, perform a full manual install (desktop Chrome "Install" via the header control, and/or Android Chrome) and confirm the app launches standalone from the installed icon
- [x] 6.3 Confirm normal (non-installed, browser-tab) usage of the app is unaffected — sign-in, book collection actions, and adaptation browsing all continue to work with the service worker active
