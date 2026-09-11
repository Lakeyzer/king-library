<script setup lang="ts">
import type { ReadingTimelineEntry, UserBook } from "~/composables/useBooks";

interface Props {
  items: ReadingTimelineEntry[];
  isOwner?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOwner: false,
});

// A local, mutable copy of the incoming items - fetchReadingTimeline() is a
// one-time snapshot (via useAsyncData on the page), not reactive state, so
// an edited date needs somewhere to actually show up rather than leaving a
// stale value on screen until the next full page load. Resynced whenever
// the prop itself changes (e.g. navigating to a different profile) - same
// pattern as ProfileBookshelf's localItems.
const localItems = ref<ReadingTimelineEntry[]>([...props.items]);
watch(
  () => props.items,
  (next) => {
    localItems.value = [...next];
  },
);

function handleSaved(row: UserBook) {
  localItems.value = localItems.value.map((entry) =>
    entry.id === row.king_work_id
      ? {
          ...entry,
          readOn: row.finished_on ?? row.started_on,
          readYear: row.read_year,
          startedOn: row.started_on,
          finishedOn: row.finished_on,
        }
      : entry,
  );
}

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
  localItems.value.map((entry) => ({
    workId: entry.id,
    slug: entry.slug,
    title: entry.title,
    date: displayDate(entry),
    startedOn: entry.startedOn,
    finishedOn: entry.finishedOn,
    readYear: entry.readYear,
    icon: "i-lucide-book-check",
    avatar: entry.coverId
      ? {
          src: getOpenLibraryCoverUrl(entry.coverId, "S"),
          alt: `${entry.title} cover`,
        }
      : undefined,
  })),
);

type TimelineItem = (typeof timelineItems.value)[number];

const editingEntry = ref<TimelineItem | null>(null);
const showEditDatesModal = ref(false);

function openEditDatesModal(item: TimelineItem) {
  editingEntry.value = item;
  showEditDatesModal.value = true;
}

const scrollerRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// Click-and-drag scrolling for mouse users - touch already scrolls natively
// via overflow-x-auto, so this only engages for pointerType "mouse" to avoid
// double-handling touch gestures. A drag is distinguished from a click by
// movement distance: past DRAG_THRESHOLD_PX, the gesture is treated as a
// drag and the resulting click on whatever's under the cursor (a work link,
// the edit-date button) is suppressed in the capture-phase handler below -
// otherwise a normal, unmoved click passes through untouched.
//
// Pointer capture is only acquired once real movement is detected (in
// onPointerMove), not on pointerdown itself. Capturing eagerly would
// retarget the resulting click event to the scroller element for every
// press - even an unmoved one - since a click is dispatched as a
// pointer-capture-derived compatibility event once capture is active. That
// bypassed the date button's and title link's own click handlers entirely,
// rather than just the drag case this is meant to suppress.
const DRAG_THRESHOLD_PX = 5;
const isDragging = ref(false);
let dragPointerId: number | null = null;
let dragStartX = 0;
let dragStartScrollLeft = 0;
let dragMoved = false;

function onPointerDown(event: PointerEvent) {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  const el = scrollerRef.value;
  if (!el) return;

  isDragging.value = true;
  dragMoved = false;
  dragPointerId = event.pointerId;
  dragStartX = event.clientX;
  dragStartScrollLeft = el.scrollLeft;
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragPointerId) return;
  const el = scrollerRef.value;
  if (!el) return;

  const delta = event.clientX - dragStartX;
  if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
    if (!dragMoved) el.setPointerCapture(event.pointerId);
    dragMoved = true;
  }
  el.scrollLeft = dragStartScrollLeft - delta;
}

function endDrag(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragPointerId) return;
  isDragging.value = false;
  const el = scrollerRef.value;
  if (el?.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
  dragPointerId = null;
}

function onClickCapture(event: MouseEvent) {
  if (!dragMoved) return;
  event.preventDefault();
  event.stopPropagation();
  dragMoved = false;
}

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

  <!--
    Below sm, assume a touch device (swipe scrolls the timeline directly) -
    the chevron buttons are hidden to give the scroller the full width, and
    the row bleeds past UContainer's own px-4 out to the screen edge rather
    than wasting that gutter on a horizontally-scrolling strip. Both revert
    at sm and up, where a mouse/trackpad user benefits from the buttons and
    the page's normal side padding applies again.
  -->
  <div v-else class="-mx-4 flex items-center gap-2 sm:mx-0">
    <UButton
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="soft"
      class="hidden shrink-0 rounded-full sm:flex"
      :disabled="!canScrollLeft"
      aria-label="Scroll left"
      @click="scrollBy('left')"
    />

    <div
      ref="scrollerRef"
      class="scrollbar-none flex-1 cursor-grab overflow-x-auto scroll-smooth px-4 pb-1 select-none sm:px-0"
      :class="{ 'cursor-grabbing': isDragging }"
      @scroll="updateScrollState"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="onClickCapture"
      @dragstart.prevent
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
        <template #date="{ item }">
          <UButton
            v-if="isOwner"
            :label="item.date || 'Add Date'"
            icon="i-lucide-pencil"
            variant="link"
            color="neutral"
            size="xs"
            class="p-0"
            @click="openEditDatesModal(item)"
          />
          <span v-else-if="item.date">{{ item.date }}</span>
        </template>

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
      class="hidden shrink-0 rounded-full sm:flex"
      :disabled="!canScrollRight"
      aria-label="Scroll right"
      @click="scrollBy('right')"
    />
  </div>

  <BookEditReadDatesModal
    v-if="editingEntry"
    v-model:open="showEditDatesModal"
    :work-id="editingEntry.workId"
    :work-title="editingEntry.title"
    :initial-started-on="editingEntry.startedOn"
    :initial-finished-on="editingEntry.finishedOn"
    :initial-read-year="editingEntry.readYear"
    @saved="handleSaved"
  />
</template>
