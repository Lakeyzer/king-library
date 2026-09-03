## 1. Header component

- [x] 1.1 Create `app/components/core/AppHeader.vue` using `UHeader`: leading side shows the "King Library" wordmark linking to `/`, followed by a `UNavigationMenu` with items Works (`/works`), Short Stories (`/short-stories`), and Adaptations (`/adaptations`); trailing side shows a `UColorModeButton`. Verify by rendering the component and confirming all three nav items and the color mode button are present.
- [x] 1.2 Verify each navigation item's `to` matches an existing page route (`app/pages/works/index.vue`, `app/pages/short-stories/index.vue`, `app/pages/adaptations/index.vue`) and that clicking each item navigates there.

## 2. Footer component

- [x] 2.1 Create `app/components/core/AppFooter.vue` using `UFooter` with a small, legally-worded disclaimer stating King Library is an unofficial, fan-made project with no affiliation to or endorsement by Stephen King or his representatives. Verify the disclaimer text renders in the footer.

## 3. Wire components into the default layout

- [x] 3.1 Update `app/layouts/default.vue` to render `AppHeader` and `AppFooter` in place of the current inline `UHeader`/`UFooter` markup. Verify the layout still renders a header above and footer below the page's contained main area (per the `app-shell` spec).
- [x] 3.2 Remove the now-unreferenced starter template pieces (`app/components/TemplateMenu.vue`, the starter `AppLogo.vue` content/usage, starter GitHub links, Nuxt-branded `USeparator`) once nothing in the layout references them. Verify with `pnpm lint` that no dangling imports/references remain.

## 4. Homepage content

- [x] 4.1 Rewrite `app/pages/index.vue` with a `UPageHero` titled "King Library" and a short description covering building a bookshelf and tracking reading progress. Verify by rendering the homepage and confirming the hero title and description text.
- [x] 4.2 Add three `UPageCTA`s below the hero, in order: Works (linking to `/works`), Short Stories (linking to `/short-stories`), Adaptations (linking to `/adaptations`). Verify the CTAs appear in that order and each link navigates to its page.

## 5. Verification

- [ ] 5.1 Run `pnpm typecheck` and `pnpm lint` and confirm both pass with the new components and homepage in place.
