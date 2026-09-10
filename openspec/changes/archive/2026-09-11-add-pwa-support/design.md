## Context

The app has no PWA tooling today: no manifest, no service worker, and `public/` contains only a single `favicon.ico` (too low-resolution for manifest icons). CLAUDE.md's non-goals already fix the target shape: "installable only — manifest + install prompt via `@vite-pwa/nuxt`; no offline data access, no service-worker caching of Supabase data." See `proposal.md` for the full motivation. This design covers how to hit that target without accidentally taking on offline caching.

## Goals / Non-Goals

**Goals:**
- Meet browser installability criteria (manifest + service worker with a fetch handler) using `@vite-pwa/nuxt`.
- Guarantee the service worker caches nothing — not the app shell, not Supabase requests.
- Give the app a small, testable seam (`canInstall` / `isInstalled` / `promptInstall()`) that the header control consumes, decoupled from the `beforeinstallprompt` browser API.

**Non-Goals:**
- Offline data access or app-shell precaching (explicit project non-goal).
- Update-available prompts/UI for the service worker (nothing is cached, so there's no meaningfully "stale" asset to prompt about).
- Push notifications, background sync, or any other service-worker feature beyond the minimum for installability.

## Decisions

**1. `@vite-pwa/nuxt` with `generateSW`, empty precache list, no runtime caching.**
`vite-plugin-pwa`'s `generateSW` strategy (the module default) still produces a service worker with a registered fetch-routing layer, which is what satisfies Chrome's "has a fetch handler" installability check — even with an empty `globPatterns: []` and `runtimeCaching: []`. This gets installability with the least code. Alternative considered: `injectManifest` with a hand-rolled SW containing a no-op fetch listener — more explicit, but more surface to maintain for a capability that intentionally does nothing. Rejected as unnecessary here.

**2. `registerType: 'autoUpdate'`.**
Since the service worker holds no cached assets, there's nothing to preserve across an update and no user-facing staleness to reconcile — auto-updating avoids building "new version available" UI that the non-goal (no offline caching) makes pointless. Alternative: `'prompt'` — rejected, it exists to protect cached content, which doesn't apply here.

**3. Installability seam lives in a composable (`composables/usePwaInstall.ts`), not directly in the header component.**
Mirrors the project's existing pattern of putting shared reactive logic in `composables/` rather than component internals. The composable owns: capturing `beforeinstallprompt` (preventing its default browser mini-infobar and stashing the event), calling `.prompt()` on request, and detecting standalone mode via `window.matchMedia('(display-mode: standalone)')` (plus `navigator.standalone` for iOS Safari, which never fires `beforeinstallprompt` at all — the composable just never reports `canInstall: true` there, and the header control correctly stays hidden per the `app-shell` delta spec).

**4. Icon set generated from one source image via `@vite-pwa/assets-generator`.**
No existing artwork is high-resolution enough for manifest icons (192, 512, maskable). Rather than hand-produce each size, generate them from a single square source image (≥512x512) using the same tool family as `@vite-pwa/nuxt`. A source image must be supplied during implementation — see Open Questions.

**5. `theme_color` / `background_color` derived from existing design tokens, not new colors.**
Use the `clay-600` token for `theme_color` (matches the app's brand accent) and `parchment-50` for `background_color` (matches the light-mode page background). Resolve these to concrete hex values at implementation time (e.g. by reading the computed value of the CSS variable) rather than hand-converting the `oklch()` values now, to avoid an inaccurate manual conversion.

## Risks / Trade-offs

- **`beforeinstallprompt` isn't universal** (Firefox and iOS Safari never fire it) → Mitigation: the `app-shell` delta spec already requires the install control to stay hidden when no prompt is available, so this degrades to "no button," not a broken one. Native install paths (Safari's own Share → Add to Home Screen, etc.) remain available to visitors regardless.
- **A misconfigured `runtimeCaching`/`globPatterns` could silently start caching Supabase responses** → Mitigation: explicit empty arrays in `nuxt.config.ts`, plus a manual check during testing (network tab / application tab in devtools) that Supabase requests still hit the network with the service worker active.
- **Generic/placeholder icon if no real artwork is supplied** → Mitigation: called out explicitly as an implementation task; not a blocker for planning.

## Migration Plan

No data migration. Rollout is: add the dependency and config, add icon assets, add the composable, add the header control, then verify with a production build (`pnpm build && pnpm preview` — PWA registration is inactive in `pnpm dev` by default) that the manifest and service worker are served and that Supabase calls are never intercepted. Rollback is a plain revert (remove the dependency/config); nothing persists server-side.

## Open Questions

- **Source icon artwork**: no King Library logo exists yet at a usable resolution. Implementation will need a square source image (≥512x512) to generate the manifest icon set from. This doesn't change the spec or approach — if nothing is supplied by implementation time, a simple placeholder (e.g. a book glyph) will be used and can be swapped later without touching behavior.
