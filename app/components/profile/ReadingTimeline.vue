<script setup lang="ts">
import type { ReadingTimelineEntry } from "~/composables/useBooks";

interface Props {
  items: ReadingTimelineEntry[];
}

const props = defineProps<Props>();

function displayDate(entry: ReadingTimelineEntry) {
  if (entry.readOn) {
    return new Date(entry.readOn).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  }
  return entry.readYear ? String(entry.readYear) : "";
}

const timelineItems = computed(() =>
  props.items.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    date: displayDate(entry),
    icon: "i-lucide-book-check",
    avatar: entry.coverId
      ? {
          src: getOpenLibraryCoverUrl(entry.coverId, "S"),
          alt: `${entry.title} cover`,
        }
      : undefined,
  })),
);

const scrollerRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollState() {
  const el = scrollerRef.value;
  if (!el) return;

  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function scrollBy(direction: "left" | "right") {
  const el = scrollerRef.value;
  if (!el) return;

  el.scrollBy({
    left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
    behavior: "smooth",
  });
}

// Content width changes with the item count, which can leave the scroller
// showing a stale enabled/disabled arrow state - re-measure after any change.
watch(
  () => props.items,
  async () => {
    if (scrollerRef.value) scrollerRef.value.scrollLeft = 0;
    await nextTick();
    updateScrollState();
  },
);

// A window/sidebar resize changes the scroller's clientWidth without firing
// a scroll or items-change event, which otherwise leaves canScrollRight
// stuck at whatever it was when the layout was wider.
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  updateScrollState();

  if (scrollerRef.value) {
    resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(scrollerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <UEmpty
    v-if="!items.length"
    icon="i-lucide-book-check"
    title="No finished books yet"
    description="Books you finish will show up here."
  />

  <div v-else class="flex items-center gap-2">
    <UButton
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="soft"
      class="shrink-0 rounded-full"
      :disabled="!canScrollLeft"
      aria-label="Scroll left"
      @click="scrollBy('left')"
    />

    <div
      ref="scrollerRef"
      class="scrollbar-none flex-1 overflow-x-auto scroll-smooth pb-1"
      @scroll="updateScrollState"
    >
      <UTimeline
        :items="timelineItems"
        orientation="horizontal"
        size="sm"
        :ui="{
          item: 'relative h-32 min-w-32 shrink-0 odd:justify-end',
          container: 'absolute inset-x-0 top-1/2 -translate-y-1/2',
          wrapper: 'text-start',
        }"
      >
        <template #title="{ item }">
          <NuxtLink
            :to="`/works/${item.slug}`"
            class="block truncate text-sm font-medium text-highlighted hover:underline"
          >
            {{ item.title }}
          </NuxtLink>
        </template>
      </UTimeline>
    </div>

    <UButton
      icon="i-lucide-chevron-right"
      color="neutral"
      variant="soft"
      class="shrink-0 rounded-full"
      :disabled="!canScrollRight"
      aria-label="Scroll right"
      @click="scrollBy('right')"
    />
  </div>
</template>
