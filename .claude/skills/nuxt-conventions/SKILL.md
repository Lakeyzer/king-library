---
name: nuxt-conventions
description: Component, props, and structure conventions for the Stephen King Library app's Nuxt 3/4 + Vue 3 frontend. Use this whenever creating, naming, or organizing any .vue component, page, or layout, whenever deciding between a Nuxt UI component and a custom one, and whenever writing a component's props. Consult before writing a single new .vue file.
---

# Nuxt Conventions — Stephen King Library

This skill is the source of truth for how frontend components are built and organized in this app. It's a living document — expect it to grow as more conventions get locked in. If a situation isn't covered here, stop and ask rather than improvising a pattern that might conflict with something decided later.

## Core rule: Nuxt UI first

Reach for a [Nuxt UI](https://ui.nuxt.com) component before building anything custom. Before writing a `<div>`-and-CSS version of something — a button, modal, dropdown, form input, table, card, badge, tabs, avatar, skeleton loader, toast, etc. — check whether Nuxt UI already has it and use that.

- Compose Nuxt UI components together rather than reaching past them to raw HTML elements for things they already cover.
- A custom component is justified when it's genuinely domain-specific (a `BookCover`, a `DarkTowerBadge`, a `ReadingProgressRing`) — not a reimplementation of something generic Nuxt UI already provides.
- Custom components should still be built **out of** Nuxt UI primitives internally where it makes sense (e.g. a custom `BookCard` composing `UCard`, `UBadge`, `UButton`) rather than hand-rolling markup that duplicates what those primitives already do (focus states, ARIA attributes, dark-mode tokens, etc.).

## Component families: folder + short filename pattern

When a set of components shares a name prefix — e.g. `DataList` and `DataListItem`, or `BookCard` and `BookCardSkeleton` — don't put them at the top level of `components/` as `DataList.vue` / `DataListItem.vue`. Instead, use a folder named after the shared prefix (lowercase, kebab-case if multi-word) and give each file just its distinguishing suffix:

```
components/
  data/
    List.vue        →  <DataList>
    ListItem.vue     →  <DataListItem>
```

This relies on Nuxt's directory-based auto-import naming: the component name is the path segments (PascalCased) joined together, so `components/data/List.vue` auto-imports as `<DataList>` with no manual import needed. Always let this convention name the component — never add a redundant prefix inside the filename itself (`data/DataList.vue` would register as `<DataDataList>`).

More examples following this pattern as they come up:

```
components/
  book/
    Card.vue         →  <BookCard>
    CardSkeleton.vue →  <BookCardSkeleton>
  adaptation/
    Poster.vue       →  <AdaptationPoster>
    PosterGrid.vue   →  <AdaptationPosterGrid>
```

A one-off component with no siblings sharing its prefix doesn't need this treatment — `components/BookshelfEmptyState.vue` is fine at the top level if nothing else starts with `BookshelfEmptyState`.

## Props: always defined via an interface

Never define props as an inline anonymous type in `defineProps<{...}>()`. Always declare a named `Props` interface first, then pass it as the generic:

```vue
<script setup lang="ts">
interface Props {
  workId: string;
  title: string;
  coverUrl?: string;
}

const props = defineProps<Props>();
</script>
```

- If any props need defaults, use `withDefaults` against the same interface rather than giving up on the interface pattern:

  ```vue
  <script setup lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg";
  }

  const props = withDefaults(defineProps<Props>(), {
    size: "md",
  });
  </script>
  ```

- Name the interface `Props` (not `ComponentNameProps`) — it's scoped to the single-file component, so the extra qualification is noise. Exception: if a props shape is genuinely shared and exported from a composable or types file for reuse across components, give it a real descriptive name there instead.
- This mirrors the "typed, not bare" preference already used for status values in the Supabase conventions (`supabase-conventions`) — literal unions and named types over bare strings/objects, consistently across the stack.

## Number motif highlighting: wrap dynamic text with `<NumberMotif>`

The app highlights every standalone `19`/`1999` in rendered text as a running Dark Tower numerology easter egg (see `NumberMotif.vue` and `app/utils/numberMotifs.ts`). This is implemented as explicit per-component wrapping, not a global scan — deliberately, since a runtime DOM/VNode scanner would risk breaking Vue's reactivity for any highlighted value that later updates (see the `add-easter-eggs` change's `design.md` for the full reasoning). That means coverage only exists where someone has actually added it.

**When creating a new page, layout, or component that renders dynamic text** (anything sourced from data or user input — titles, dates, counts, stats, taglines, usernames, free-text fields, etc.), wrap it in `<NumberMotif :text="..." />` instead of a bare `{{ }}` interpolation:

```vue
<!-- Instead of: -->
<p>{{ work.title }}</p>

<!-- Do: -->
<p><NumberMotif :text="work.title" /></p>
```

Skip it only for text that can never vary with data — static labels, section headings, nav/button text, Nuxt UI `label`/`title` props rendered inside another component's own template (out of reach anyway), and the live value of a `v-model`-bound input a visitor is actively typing into.

## A page file can't share a name with a sibling directory - even to share layout chrome

Don't create `pages/foo/[param].vue` alongside a `pages/foo/[param]/` directory. Nuxt's "nested routes" convention makes the file an implicit **parent** for the *entire* same-named directory - not just the routes you meant it to parent - and a child only renders if the parent contains a `<NuxtPage />`. Two distinct bugs came from this exact shape while building the profile tabs:

1. **A plain leaf page accidentally became a parent.** `read-list.vue`/`watch-list.vue` were added under `profile/[username]/` while `profile/[username].vue` was still a full profile page with no `<NuxtPage />` - every nested route silently rendered the profile page instead of its own content, no error or warning.
2. **A deliberate parent (added to fix #1) over-matched.** Once `profile.vue` was made a real parent - rendering a shared header + tab bar + `<NuxtPage />` for `/profile`, `/profile/read-list`, `/profile/watch-list` - it *also* parented `profile/[username].vue`, since that file (and its own `[username]/` subdirectory) lives inside the same `profile/` directory `profile.vue` owns. Visiting someone else's profile rendered **both** parents' headers stacked: your own (from `profile.vue`) on top of theirs (from `profile/[username].vue`). Nuxt's directory-based nesting has no way to parent only *some* of a directory's routes.

**The fix used here: don't reach for Nuxt's file-based nested routing to share chrome across sibling routes at all.** Instead, each route is an independent leaf page, and shared chrome is a plain, non-async, prop-driven component (`ProfileRouteChrome.vue`) that every leaf page renders directly - not a route-level parent. A page-level composable (`provideViewedProfile()` in `useProfile.ts`) takes whatever `Profile` the page has already resolved and `provide()`s the derived context; the tab-content component nested inside the chrome's slot (`ReaderChecklistTab.vue`, `ReadListTab.vue`, `WatchListTab.vue`) reads it via `inject()` (`useViewedProfile()`). This gets the same DRY sharing nested routing was going for, without Nuxt's all-or-nothing directory-parenting rule ever entering the picture. Reach for actual nested routing (`[param].vue` + `<NuxtPage />`) only when every route under that directory is genuinely meant to be a child of it - never when a dynamic segment inside that same directory (like `[username]/`) needs to stay independent.

### `provide()` after your own composable's internal `await` doesn't reliably work

A third bug from the same feature, once the `<NuxtPage />` issues above were fixed: `provide()` calls made *inside* an async composable, after that composable's own `await`, silently failed for every `inject()` downstream - `/profile/[username]` 500'd with the injected composable's "must be called inside..." error, even though the calling page did `await theComposable(...)` before rendering anything.

Why: `<script setup>`'s compiler specially wraps top-level `await` expressions (`withAsyncContext`) so Vue's current-component-instance context is restored once that specific await resolves - which is what makes calling more composables, `computed()`, etc. after an `await` in a page's own script safe. But that compiler transform only wraps awaits written directly in the page's own script. A separate async composable function that the page merely calls with `await` gets no such treatment for *its own internal* awaits - when its internal `await useAsyncData(...)` resolves and the rest of its body (including a `provide()` call) resumes, that resumption is a plain JS microtask continuation with no guaranteed current instance, so the provided value doesn't reliably attach to the calling page.

The fix: keep the actual `await` (`useAsyncData`, `fetchProfileByUsername`, etc.) directly in the page's own top-level script, and make the composable that calls `provide()` purely synchronous, called with the already-resolved data right after - `provideViewedProfile(profile)` in `useProfile.ts`, called from each `profile/*` page after that page's own `await useAsyncData(...)` has resolved, never doing the fetch itself. If a composable needs to both fetch something async *and* provide a value derived from it, split it into two: an async part the page awaits, and a synchronous part the page then calls.

## `BookReadingActions` / `AdaptationWatchActions` need their page to pre-fetch status

`BookReadingActions.vue` and `AdaptationWatchActions.vue` (and anything built on `WorkTile`/`AdaptationTile`, which render them) don't fetch a user's reading/watch status themselves — they read it out of the shared `userBooksByWorkId` / `userAdaptationsByAdaptationId` state exposed by `useBooks()` / `useAdaptations()`. That state is only populated when something calls `fetchUserBooks()` / `fetchUserAdaptations()`. **Any page that renders these components must call that fetch itself**, or every tile silently renders as if the user has no relationship to the work/adaptation at all (no "On Readlist"/"On Watchlist" tooltip, wrong primary action, etc.) — this isn't a loading-state flicker, it's a permanently wrong result, since nothing on the page ever triggers the fetch.

```ts
const { fetchUserBooks } = useBooks();
await useAsyncData("user-books", fetchUserBooks);

const { fetchUserAdaptations } = useAdaptations();
await useAsyncData("user-adaptations", fetchUserAdaptations);
```

Always use these exact key strings (`"user-books"` / `"user-adaptations"`) — every page already does, so this is what lets Nuxt's `useAsyncData` cache share one fetch across pages/components rather than each page keying its own copy.

**Don't try to move this fetch into `BookReadingActions`/`AdaptationWatchActions` themselves** to make it automatic — it looks like it should work (same cache key), but it doesn't by default. `useAsyncData`'s default `dedupe: 'cancel'` only cancels-and-restarts an in-flight call for the same key rather than reusing it, and on the server there's no "already pending" guard at all — so calling it from a component rendered N times in a list (e.g. every tile in a grid) fires N redundant fetches instead of one. Getting single-flight behavior out of a shared component would require explicitly passing `{ dedupe: 'defer' }`, and even then a client-side navigation to a page whose data isn't already cached would flash the neutral/default state on first paint, which the current page-level `await` avoids entirely. If a future page renders these action components, add the two-line fetch above to that page — don't assume it happens automatically.

## Open / not yet decided

These haven't been settled yet — don't assume a pattern for them, ask if one is needed:

- State management approach beyond composables (e.g. whether any global store is ever warranted, or composables + Supabase are enough)
- Styling conventions beyond "use Nuxt UI" (custom Tailwind config, design tokens, dark mode specifics) — see the `frontend-design` skill for general design guidance in the meantime
- Testing conventions for components
- Accessibility checklist beyond what Nuxt UI provides out of the box
