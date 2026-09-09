## Context

See proposal.md - Why/What Changes for motivation and scope. Relevant current state:

- `app/app.vue` sets `useHead`/`useSeoMeta` once, globally, with the unmodified Nuxt starter template's placeholder title/description/`ogImage` — this is the only site-wide metadata that exists today.
- Three detail pages (`works/[slug].vue`, `adaptations/[slug].vue`, `short-stories/[slug].vue`) already call `useSeoMeta({ title: ... })` with just a bare title; every other page sets no metadata at all.
- `work.description` (curated, nullable) and the adaptation's TMDb `overview` (fetched live via the existing `fetchTmdbDetails`/`server/api/tmdb/[mediaType]/[id].get.ts` proxy) are already loaded by the work and adaptation detail pages for on-page display — no new data fetching is needed to source their descriptions.
- `king_short_stories` has no description column and no cover of its own; the detail page currently borrows the earliest collection's cover only for its on-page hero image, not for any metadata purpose.
- Cover/poster URLs (`getOpenLibraryCoverUrl`, `getTmdbPosterUrl`, `app/utils/coverImages.ts`) are already absolute (`covers.openlibrary.org` / `image.tmdb.org`), so they can be used directly as `og:image` with no URL rewriting.
- No SEO module (`@nuxtjs/seo`, `nuxt-og-image`, etc.) is installed. Nuxt's built-in `useSeoMeta`/`useHead` composables are already the pattern in use.

## Goals / Non-Goals

**Goals:**
- One consistent, low-duplication way for every page to declare its title and description.
- A title template applied globally, with the homepage as the one documented exception.
- Work and adaptation detail pages get a real share image; every other page intentionally has none.

**Non-Goals:**
- No `og:url`/canonical tag and no configured production site URL. Link-preview consumers (Slack, iMessage, Discord, Twitter/X) render their card from the scraped `og:title`/`og:description`/`og:image` plus the URL the user actually shared — they don't require `og:url` to produce a correct preview — so this is left out rather than introducing a `runtimeConfig.public.siteUrl` env var with no other current consumer.
- No XML sitemap, `robots.txt`, or structured data (JSON-LD). Not requested; out of scope for this change.
- No new external dependency (e.g. `@nuxtjs/seo`). Nuxt's built-in `useSeoMeta`/`useHead` already covers title, description, and Open Graph/Twitter tags.
- No change to what data is stored — descriptions are derived at render time from data that already exists (`king_works.description`, the live TMDb `overview`), not persisted anywhere new.

## Decisions

**Shared composable (`useSeo`) instead of per-page boilerplate.** Every page needs the same shape of call (title, description, optional image), and the truncation and fallback-copy logic in `specs/seo-metadata/spec.md` would otherwise be copy-pasted across ~12 pages. A small composable (e.g. `app/composables/useSeo.ts`) exposing one function — `setPageSeo({ title, description, image? })` — wraps `useSeoMeta` and centralizes: description truncation to 160 characters at a word boundary, and setting `ogTitle`/`ogDescription`/`twitterCard`/`ogImage`/`twitterImage` consistently alongside `title`/`description`. Each page calls it once with page-specific values instead of hand-rolling `useSeoMeta` calls. Alternative considered: leave each page calling `useSeoMeta` directly — rejected because the truncation rule and the image/no-image `twitterCard` split would silently drift between pages over time.

**Title template via Nuxt's built-in `titleTemplate`, overridden on the homepage.** `app.vue` sets a global `titleTemplate: (title) => title ? `${title} • King Library` : 'King Library'` via `useHead`. Every page then just sets its own `title` (through `useSeo`) and gets the suffix for free. The homepage is the documented exception: it calls `useHead({ titleTemplate: '%s' })` itself (Nuxt's mechanism for a page to opt out of an inherited title template) alongside `setPageSeo({ title: 'King Library', ... })`, so its rendered title is the bare site name with no suffix. Alternative considered: give every page a full literal title string (`"Works • King Library"`, etc.) and drop the template — rejected because it pushes the site-name suffix into every single call site instead of one shared place, which is exactly the kind of drift the template mechanism exists to prevent.

**Descriptions are generated at render time from existing data, per source:**
- Work detail: `work.description` when non-null, else a fallback string built from title/type/author.
- Adaptation detail: the TMDb `overview` already fetched for the page when present, else a fallback from title/year/type.
- Short story detail: always a generated fallback (title/type/original publish year) — there is no description column to prefer.
- Static and listing pages (home, works/short-stories/adaptations index, profile, settings, onboarding, confirm): short hand-written copy, hardcoded per page.

Alternative considered: store a `meta_description` column per work/adaptation for curators to author directly — rejected as unnecessary; the existing curated `description`/TMDb `overview` already reads as good default copy, and hand-authoring a second description per row is a bigger content-ops burden than the truncation fallback pays for.

**Share images only on work and adaptation detail pages, using the item's own cover/poster.** These are the only two page types with reliable, licensed-for-display artwork of their own (`work.cover_id` via Open Library, `adaptation.tmdb_poster_path` via TMDb). Short stories have no cover of their own — the detail page's on-page hero borrows a collection's cover as a *display* fallback, but that's a UI convenience, not this item's own artwork, so per the proposal's explicit scope it's not reused as a share image. No sitewide default share image exists (no logo/social-card asset in `public/`), so pages without their own artwork simply omit `og:image` rather than fall back to a generic graphic — consistent with the proposal's explicit "works and adaptations only" scope for images. `twitterCard` is `summary_large_image` when an image is present, `summary` otherwise.

## Risks / Trade-offs

- **[Risk]** TMDb's `overview` is fetched live, per request, only for adaptation pages that have a linked `tmdb_id`; if that fetch is slow or fails, the description would be missing at the moment metadata is set. → **Mitigation**: this reuses the exact same `fetchTmdbDetails` call and null-safe pattern the page already awaits for its on-page display; the fallback description (title/year/type) is derived from `adaptations` table columns already loaded, so it doesn't depend on TMDb succeeding.
- **[Risk]** Truncating free-form text (curated description, TMDb overview) to 160 characters could land mid-sentence in a way that reads oddly in a share preview. → **Mitigation**: truncate at the last word boundary before the limit, not mid-word (per spec).
- **[Trade-off]** Skipping `og:url`/canonical means a shared preview always reflects the exact URL shared (including any trailing params), never a normalized canonical link. Acceptable per the Non-Goals above — no current consumer needs it, and it's cheap to add later without touching this change's specs.

## Open Questions

None — the scope boundaries above (no canonical URL, no share image outside work/adaptation pages, generated-not-authored descriptions) are settled by this design rather than deferred.
