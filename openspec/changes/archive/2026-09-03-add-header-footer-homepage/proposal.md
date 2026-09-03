## Why

The app currently ships with the Nuxt UI starter template's header, footer, and homepage — placeholder branding, template navigation links, and generic copy that don't reflect King Library. The app needs its own header, footer, and homepage before real navigation and content work continues.

## What Changes

- Add `components/core/AppHeader.vue`: a `UHeader` with "King Library" wordmark on the left, a `UNavigationMenu` (Works, Short Stories, Adaptations) next to it, and a `UColorModeButton` on the right.
- Add `components/core/AppFooter.vue`: a `UFooter` with a small legal disclaimer that this is an unofficial, unaffiliated personal project with no connection to Stephen King.
- Update `app/layouts/default.vue` to render `AppHeader`/`AppFooter` instead of the starter template's inline header/footer markup.
- Remove the now-unused starter template artifacts (`TemplateMenu.vue`, starter `AppLogo.vue` content, starter GitHub links) that the new header/footer replace.
- Rewrite `app/pages/index.vue` as the King Library homepage: a `UPageHero` ("King Library" + short description about building a bookshelf and tracking reading progress) followed by three `UPageCTA`s — Works, Short Stories, Adaptations — each linking to its respective browsing page.

## Capabilities

### New Capabilities
- `homepage`: the landing page's hero and section content introducing Works, Short Stories, and Adaptations.

### Modified Capabilities
- `app-shell`: header now shows "King Library" branding, primary navigation (Works, Short Stories, Adaptations), and a color mode toggle; footer now shows a legal disclaimer of non-affiliation with Stephen King; header and footer are implemented as dedicated components in `components/core/`.

## Impact

- `app/layouts/default.vue` — swaps starter header/footer markup for the new core components.
- `app/components/core/AppHeader.vue`, `app/components/core/AppFooter.vue` — new.
- `app/pages/index.vue` — rewritten homepage content.
- `app/components/TemplateMenu.vue`, starter `AppLogo.vue` — removed / replaced (no longer referenced once the header is rebuilt).
- No database, API, or composable changes.
