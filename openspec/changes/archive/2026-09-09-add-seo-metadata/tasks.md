## 1. Shared SEO composable

- [x] 1.1 Create `app/composables/useSeo.ts` exposing `setPageSeo({ title, description, image? })`, which truncates `description` to 160 characters at a word boundary and calls `useSeoMeta` with `title`, `description`, `ogTitle`, `ogDescription`, `twitterCard` (`summary_large_image` when `image` is passed, `summary` otherwise), and `ogImage`/`twitterImage` when `image` is passed. Verify with a unit test (or manual check) that a >160-character description is truncated at a word boundary and a <160-character one passes through unchanged.
- [x] 1.2 Add a small title-fallback helper (or inline generator functions) for: work fallback (title/type/author), adaptation fallback (title/year/type), short story fallback (title/type/original publish year). Verify each helper returns a non-empty string given a minimal input (no description/overview/year).

## 2. Site-wide title template and defaults

- [x] 2.1 In `app/app.vue`, replace the placeholder `useSeoMeta`/`useHead` block (Nuxt starter title, description, `ogImage`) with a global `useHead({ titleTemplate: (title) => title ? \`${title} • King Library\` : 'King Library' })` and remove the hardcoded starter-template `ogImage`. Verify by inspecting the rendered `<title>` on a non-home page — it should end with ` • King Library`.
- [x] 2.2 In `app/pages/index.vue` (home), call `useHead({ titleTemplate: '%s' })` to opt out of the inherited template, then call `setPageSeo({ title: 'King Library', description: <short home description> })`. Verify the rendered `<title>` on `/` is exactly `King Library`, with no suffix.

## 3. Static and listing pages

- [x] 3.1 Add `setPageSeo({ title, description })` to `app/pages/works/index.vue`, `app/pages/short-stories/index.vue`, and `app/pages/adaptations/index.vue` with short hand-written titles/descriptions for each listing. Verify each route's rendered `<title>` ends with ` • King Library` and a `description` meta tag is present and non-empty.
- [x] 3.2 Add `setPageSeo({ title, description })` to `app/pages/profile/index.vue` and `app/pages/settings.vue`. Verify both routes render a page-specific title (suffixed) and a non-empty description.
- [x] 3.3 Add `setPageSeo({ title, description })` to `app/pages/onboarding.vue`. Verify the route renders a page-specific title (suffixed) and a non-empty description.
- [x] 3.4 Add `setPageSeo({ title: profile.username, description: <generated from username> })` to `app/pages/profile/[username].vue`, using the already-fetched `profile` data. Verify visiting a public profile renders a title of the form `{username} • King Library` and a non-empty description.
- [x] 3.5 Decide whether `app/pages/confirm.vue` needs page metadata (it's an OAuth redirect target, `ssr: false`, unlikely to be shared or indexed) — if not, leave it unchanged and note why in the task's completion; if yes, add `setPageSeo` there too. Verify the decision is recorded and, if metadata was added, that it renders.
  - Decision: left unchanged. It's rendered client-side only (`routeRules: { '/confirm': { ssr: false } }`), immediately redirects a signed-in visitor away, and is never a link a user would share or a crawler would index — no title/description would ever actually be seen.

## 4. Work and short story detail pages

- [x] 4.1 In `app/pages/works/[slug].vue`, replace the existing bare `useSeoMeta({ title: work.title })` with `setPageSeo({ title: work.title, description: work.description or the generated work fallback (title/type/author), image: work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, "L") : undefined })`. Verify: a work with a curated description renders that description (or its truncated form) as the meta description and includes the cover as `ogImage`; a work with `description: null` renders the generated fallback; a work with no `cover_id` omits `ogImage`.
- [x] 4.2 In `app/pages/short-stories/[slug].vue`, replace the existing bare `useSeoMeta({ title: story.title })` with `setPageSeo({ title: story.title, description: <generated short-story fallback> })` — no `image` argument, per spec. Verify the rendered meta description is the generated fallback and no `og:image`/`twitter:image` tag is present.

## 5. Adaptation detail page

- [x] 5.1 In `app/pages/adaptations/[slug].vue`, replace the existing bare `useSeoMeta({ title: adaptation.title })` with `setPageSeo({ title: adaptation.title, description: tmdb?.overview or the generated adaptation fallback (title/year/type), image: adaptation.tmdb_poster_path ? getTmdbPosterUrl(adaptation.tmdb_poster_path, "w500") : undefined })`. Verify: an adaptation whose TMDb fetch returns an overview renders that overview (or its truncated form) as the meta description and includes the poster as `ogImage`; an adaptation with no TMDb overview (fetch failed, or no `tmdb_id`) renders the generated fallback; an adaptation with no `tmdb_poster_path` omits `ogImage`.

## 6. Verification

- [ ] 6.1 Walk every route (home, works index, work detail, short stories index, short story detail, adaptations index, adaptation detail, profile index, public profile, settings, onboarding) and confirm each renders a page-specific `<title>` per the template rule and a non-empty `description` meta tag — no route left with placeholder or missing metadata.
- [ ] 6.2 Confirm only work and adaptation detail pages render an `og:image`/`twitter:image` tag; every other route (including short story detail) renders none.
- [ ] 6.3 Spot-check a work detail page, an adaptation detail page, and one page without an image (e.g. home) using a social-preview debugger (e.g. paste the URL into a Slack message draft, or use a Facebook/Twitter card validator) to confirm the rendered title/description/image match expectations end to end.
