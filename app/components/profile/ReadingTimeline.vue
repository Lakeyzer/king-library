<script setup lang="ts">
import type { ReadingTimelineEntry, UserBookRead } from "~/composables/useBooks";

interface Props {
  items: ReadingTimelineEntry[];
  isOwner?: boolean;
  /** "horizontal" (default) is the showcase's drag-scrollable strip; "vertical" is a plain top-to-bottom UTimeline for the dedicated Reading Timeline page - see add-reread-tracking's design.md. */
  orientation?: "horizontal" | "vertical";
}

const props = withDefaults(defineProps<Props>(), {
  isOwner: false,
  orientation: "horizontal",
});

// A local, mutable copy of the incoming items - fetchReadingTimeline() is a
// one-time snapshot (via useAsyncData on the page), not reactive state, so
// an edited date needs somewhere to actually show up rather than leaving a
// stale value on screen until the next full page load. Resynced whenever
// the prop itself changes (e.g. navigating to a different profile) - same
// pattern as ProfileBookshelf's localItems. Keyed by readId, not workId - a
// work read more than once has more than one entry (see
// add-reread-tracking's design.md), so entries are no longer 1:1 with works.
const localItems = ref<ReadingTimelineEntry[]>([...props.items]);
watch(
  () => props.items,
  (next) => {
    localItems.value = [...next];
  },
);

function handleSaved(row: UserBookRead) {
  localItems.value = localItems.value.map((entry) =>
    entry.readId === row.id
      ? {
          ...entry,
          startedOn: row.started_on,
          readOn: row.read_on,
          readYear: row.read_year,
          note: row.note,
          format: row.format,
          rating: row.rating,
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
    readId: entry.readId,
    workId: entry.workId,
    slug: entry.slug,
    title: entry.title,
    date: displayDate(entry),
    startedOn: entry.startedOn,
    readOn: entry.readOn,
    readYear: entry.readYear,
    note: entry.note,
    format: entry.format,
    rating: entry.rating,
    icon: "i-lucide-book-check",
    avatar: entry.coverId
      ? {
          src: getOpenLibraryCoverUrl(entry.coverId, "M"),
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
  <div v-else-if="orientation === 'horizontal'" class="-mx-4 flex items-center gap-2 sm:mx-0">
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
          item: 'relative h-40 min-w-40 shrink-0 odd:justify-end',
          container: 'absolute inset-x-0 top-1/2 -translate-y-1/2',
          indicator: 'size-12',
          wrapper: 'text-start pl-6',
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
          <span v-else-if="item.date"><NumberMotif :text="item.date" /></span>
        </template>

        <template #title="{ item }">
          <NuxtLink
            :to="`/works/${item.slug}`"
            class="block truncate text-sm font-medium text-highlighted hover:underline"
          >
            <NumberMotif :text="item.title" />
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

  <!--
    Vertical: the dedicated Reading Timeline page's full list, no
    drag-scroller chrome - see reading-timeline capability. `indicator:
    'size-12'` matches the horizontal strip's own indicator size exactly
    (see that branch's `:ui` below) rather than the smaller size the "sm"
    prop alone would produce, so cover thumbnails render at the same size
    in both places.

    Alternating left/right layout follows Nuxt UI's own documented recipe
    (https://ui.nuxt.com/docs/components/timeline#with-alternating-layout):
    `even:`/`odd:` belong on `item` itself, not `wrapper` - Nuxt UI's own
    markup always renders `wrapper` as the *second* DOM child of `item`
    (container is first), so `wrapper:nth-child(even)` is true for every
    item uniformly and never alternates; `item` is the element whose
    position actually varies among the root's children, which is what
    needs to flip per entry. (An earlier version of this got this backwards
    and every entry rendered on the same side.)

    `even:flex-row-reverse` swaps icon/text order, and the paired
    `-translate-x-[calc(100%-3rem)]` cancels that reversal's offset so the
    icon lands back in the same column odd items' icons already occupy -
    the two don't alternate icon position, they share one column. The whole
    `<UTimeline>` then gets `translate-x-[calc(50%-1.5rem)]` to nudge that
    shared column from the left edge to true center. `3rem`/`1.5rem` are
    this indicator's rendered width/half-width (`size-12` = 3rem) - not the
    docs' own `2rem`/`1rem`, tuned to their demo's default (unset)
    indicator size instead.

    These translates paint outside `item`'s own layout box by design (that's
    what centers a flush-left column) - a `transform` moves only the
    painted position, not the box a browser reserves for scrolling, so
    without a clip somewhere that overflow becomes the *page's* horizontal
    scroll. The `overflow-x-hidden` on the wrapping div below exists
    specifically to contain that at this component's boundary instead.

    `wrapper` also gets `max-w-[calc(50%-2.25rem)]` - the reverse/translate
    trick only relocates the *indicator*; it does nothing to stop each
    side's text from growing most of the way across the item's full width,
    which without a cap would visually overlap the opposite side well
    before reaching the centerline. `2.25rem` = half the indicator's width
    (1.5rem) plus `item`'s own `gap-3` (0.75rem).

    All of the above is gated behind `sm:` so a narrow phone screen gets
    the plain single-column layout instead of two cramped reversed columns.

    `wrapper`'s `pb-10` (un-gated - applies at every width) gives more
    breathing room between consecutive nodes along the line than the
    "sm" size's own default `pb-6` did; ungated because that spacing is
    about legibility of the list itself, not the alternating layout.
  -->
  <div v-else class="overflow-x-hidden">
    <UTimeline
      :items="timelineItems"
      orientation="vertical"
      size="sm"
      class="sm:translate-x-[calc(50%-1.5rem)]"
      :ui="{
        item: 'sm:even:flex-row-reverse sm:even:-translate-x-[calc(100%-3rem)] sm:even:text-end',
        indicator: 'size-12',
        wrapper: 'pb-10 sm:max-w-[calc(50%-2.25rem)]',
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
        <span v-else-if="item.date"><NumberMotif :text="item.date" /></span>
      </template>

      <template #title="{ item }">
        <NuxtLink
          :to="`/works/${item.slug}`"
          class="block truncate text-sm font-medium text-highlighted hover:underline"
        >
          <NumberMotif :text="item.title" />
        </NuxtLink>
      </template>

      <template #description="{ item }">
        <!--
          `text-end` on `wrapper` (from the item-level `sm:even:text-end`
          override above) only ever aligns inline content - it doesn't
          reposition these block-level flex rows themselves, so the note
          paragraph's text follows it for free but this format/rating row
          needs its own `justify-end` to match. `group-even:` reaches back
          up to the nearest `.group` ancestor, which is `item` itself
          (Nuxt UI's own base theme already puts `group` there, for its
          `group-data-[state=...]` indicator styling) - same even/odd
          determination the item-level override above uses, just applied
          here instead of relying on text-align to carry it down.
        -->
        <div
          v-if="item.format || item.rating || (item.note && isOwner)"
          class="mt-0.5 flex flex-col gap-0.5"
        >
          <div
            v-if="item.format || item.rating"
            class="flex items-center gap-1.5 text-xs text-muted sm:group-even:justify-end"
          >
            <span v-if="item.format" class="flex items-center gap-1">
              <UIcon :name="READ_FORMAT_ICON[item.format]" class="size-3.5" />
              {{ READ_FORMAT_LABEL[item.format] }}
            </span>
            <span v-if="item.format && item.rating">·</span>
            <span v-if="item.rating" class="flex items-center gap-0.5">
              <UIcon
                v-for="star in 5"
                :key="star"
                name="i-lucide-star"
                class="size-3"
                :class="star <= item.rating ? 'text-warning' : 'text-muted'"
              />
            </span>
          </div>
          <!-- Notes are personal - only the timeline's own owner sees them, never a visitor. -->
          <p v-if="item.note && isOwner" class="text-xs text-muted">
            <NumberMotif :text="item.note" />
          </p>
        </div>
      </template>
    </UTimeline>
  </div>

  <BookEditReadDatesModal
    v-if="editingEntry"
    v-model:open="showEditDatesModal"
    :read-id="editingEntry.readId"
    :work-id="editingEntry.workId"
    :work-title="editingEntry.title"
    :initial-started-on="editingEntry.startedOn"
    :initial-read-on="editingEntry.readOn"
    :initial-read-year="editingEntry.readYear"
    :initial-note="editingEntry.note"
    :initial-format="editingEntry.format"
    :initial-rating="editingEntry.rating"
    @saved="handleSaved"
  />
</template>
