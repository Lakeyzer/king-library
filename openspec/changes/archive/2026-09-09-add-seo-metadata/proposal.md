## Why

No page in the app sets real title or description metadata today — the header still carries the Nuxt starter template's placeholder title, description, and `ogImage`, and the three detail pages that call `useSeoMeta` only ever set a bare `title`. Search engines have nothing meaningful to index per page, and sharing any link (a work, an adaptation, a profile) into iMessage, Slack, or social media produces either the Nuxt starter's boilerplate preview or no preview at all.

## What Changes

- Replace the placeholder `useSeoMeta` block in `app.vue` with real site defaults, and add a title template so every page's `<title>` renders as `{page title} • King Library` except the homepage, which renders as exactly `King Library`.
- Add a title and meta description to every route: home, works index, work detail, short stories index, short story detail, adaptations index, adaptation detail, profile (own), public profile (`/profile/[username]`), settings, onboarding, confirm.
- Work and adaptation detail pages additionally get a social share image (`og:image`/`twitter:image`) built from the item's own cover/poster art, so sharing a work or adaptation link renders a title + description + cover/poster preview card. Short story pages are explicitly out of scope for images (see Impact) — they get title + description only.
- Descriptions are generated per page rather than authored per row:
  - Works: derived from the curated `king_works.description` when present, with a generic fallback (title, author byline, type) when it's null.
  - Adaptations: derived from the TMDb overview already fetched for the detail page, with a fallback (title, year, type) when TMDb has no overview or the adaptation isn't linked to TMDb.
  - Short stories: `king_short_stories` has no description column, so these always use a generated fallback (title, type, original publish year when known).
  - Static/listing pages (home, index pages, profile, settings, onboarding): short hand-written copy.
- Long generated descriptions (e.g. a lengthy curated work description or TMDb overview) are truncated to a safe meta-description length rather than passed through verbatim.

## Capabilities

### New Capabilities
- `seo-metadata`: page-level `<title>`/meta-description conventions (including the home vs. templated-title split) across every route, plus social share image metadata for work and adaptation detail pages.

### Modified Capabilities
(none — no existing capability's own requirements change; this adds a cross-cutting metadata layer on top of pages defined by `homepage`, `work-details`, `adaptation-details`, `short-stories-browsing`, `profile-showcase`, `app-shell`, etc.)

## Impact

- `app/app.vue` — replace placeholder `useSeoMeta`/`useHead` with real site defaults and a title template.
- `app/pages/**/*.vue` — every page adds title + description metadata; `works/[slug].vue` and `adaptations/[slug].vue` additionally add share-image metadata.
- Likely a new shared composable (e.g. `useSeo`/`usePageSeo`) so the title-template + truncation logic isn't duplicated across ~12 pages — left to design.md.
- No schema changes: work descriptions and TMDb overviews are read from data that already exists; no new columns needed.
- No new external dependency required — Nuxt's built-in `useSeoMeta`/`useHead` (already used in this codebase) covers title, meta description, and Open Graph/Twitter card tags without adding a module.
