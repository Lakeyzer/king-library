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

## Open / not yet decided

These haven't been settled yet — don't assume a pattern for them, ask if one is needed:

- State management approach beyond composables (e.g. whether any global store is ever warranted, or composables + Supabase are enough)
- Styling conventions beyond "use Nuxt UI" (custom Tailwind config, design tokens, dark mode specifics) — see the `frontend-design` skill for general design guidance in the meantime
- Testing conventions for components
- Accessibility checklist beyond what Nuxt UI provides out of the box
