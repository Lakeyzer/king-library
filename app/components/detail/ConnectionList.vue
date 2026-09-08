<script setup lang="ts">
import { NuxtLink } from "#components";

export interface ConnectionListItem {
  id: string;
  title: string;
  /** Omit along with imageAlt for items with no image concept at all (e.g. short stories) - a plain title renders instead of a thumbnail. */
  imageSrc?: string | null;
  imageAlt?: string;
  /** Omit both year and typeLabel to render just a title, with no metadata line. Only shown in vertical orientation. */
  year?: number | null;
  typeLabel?: string;
  to?: string;
}

interface Props {
  heading: string;
  items: ConnectionListItem[];
  /** Only needed when some items have an image concept (imageSrc set, possibly to null). */
  placeholderIcon?: string;
  /** "horizontal" is a wrapping grid of just covers/posters, no title - for items with real cover art. Defaults to a vertical detail list. */
  orientation?: "vertical" | "horizontal";
}

withDefaults(defineProps<Props>(), {
  orientation: "vertical",
});
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-3">
    <h3 class="sticky top-0 z-10 bg-default py-1 text-sm font-semibold text-highlighted">
      {{ heading }}
    </h3>

    <ul v-if="orientation === 'horizontal'" class="hidden flex-wrap gap-3 sm:flex">
      <li v-for="item in items" :key="item.id" class="w-28">
        <component
          :is="item.to ? NuxtLink : 'div'"
          :to="item.to"
          class="block"
        >
          <ImageThumbnail
            :src="item.imageSrc ?? null"
            :alt="item.imageAlt ?? item.title"
            :placeholder-icon="placeholderIcon ?? 'i-lucide-file'"
            size="lg"
          />
        </component>
      </li>
    </ul>

    <ul
      class="flex flex-col divide-y divide-default"
      :class="{ 'sm:hidden': orientation === 'horizontal' }"
    >
      <li v-for="item in items" :key="item.id">
        <component
          :is="item.to ? NuxtLink : 'div'"
          :to="item.to"
          class="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2"
          :class="{ 'hover:bg-accented/50': item.to }"
        >
          <ImageThumbnail
            v-if="item.imageSrc !== undefined"
            :src="item.imageSrc"
            :alt="item.imageAlt ?? item.title"
            :placeholder-icon="placeholderIcon ?? 'i-lucide-file'"
          />
          <div class="min-w-0 flex-1">
            <p
              class="truncate text-sm font-medium"
              :class="{ 'group-hover:underline': item.to }"
            >
              {{ item.title }}
            </p>
            <p
              v-if="item.year != null || item.typeLabel"
              class="flex flex-wrap items-center gap-1 truncate text-xs text-muted"
            >
              <span v-if="item.year != null">{{ item.year }}</span>
              <span v-if="item.typeLabel">{{ item.typeLabel }}</span>
            </p>
          </div>
        </component>
      </li>
    </ul>
  </div>
</template>
