<script setup lang="ts">
import type { BookshelfItem } from "~/composables/useBookshelf";

interface Props {
  item: BookshelfItem;
  isOwner: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ removed: [] }>();

// Cover-resolution order: an edition tile tries its own cover first (built
// from a stored id, same as getOpenLibraryCoverUrl); if that edition has no
// cover art on file - or the work never had an edition picked at all - fall
// back to the work's own Open Library cover, fetched live since it isn't
// stored anywhere (see supabase-conventions "Cover images"). Only once both
// of those are unavailable does the tile fall back to an icon + title.
const coverSrc = ref<string | null>(
  props.item.kind === "edition" ? getEditionCoverUrl(props.item.editionId, "M") : null,
);

const triedWorkFallback = ref(false);
// Whether a work-cover fallback is even worth attempting - only an edition
// tile with a known Open Library work key has anywhere left to fall back to
// (a work tile's own cover attempt already *is* the work-cover attempt).
const canTryWorkFallback = computed(
  () => props.item.kind === "edition" && !triedWorkFallback.value && !!props.item.openLibraryWorkKey,
);

async function tryWorkCoverFallback() {
  triedWorkFallback.value = true;
  coverSrc.value = props.item.openLibraryWorkKey
    ? await getWorkCoverUrl(props.item.openLibraryWorkKey, "M")
    : null;
}

onMounted(() => {
  if (props.item.kind === "work") tryWorkCoverFallback();
});

const hasError = ref(false);
watch(coverSrc, () => {
  hasError.value = false;
});

// Open Library's covers API doesn't 404 for an id with no cover art on file
// - it returns a 1x1 pixel GIF with a 200 status instead, which never fires
// @error. Treating a suspiciously tiny loaded image as "no cover" catches
// that case too, alongside a genuine load failure - and, for an edition
// tile with somewhere left to fall back to, triggers the work-cover
// fallback above rather than giving up immediately.
const MIN_VALID_COVER_DIMENSION = 4;

function handleCoverFailure() {
  if (canTryWorkFallback.value) {
    tryWorkCoverFallback();
  } else {
    hasError.value = true;
  }
}

// Read the loaded image off NuxtImg's exposed element rather than
// event.target: when the SSR'd cover is already in the browser cache (the
// common case on a full page refresh), NuxtImg's mounted hook sees the
// underlying <img> as already complete and emits a synthetic
// `new Event("load")` instead of a real DOM event - whose target is always
// null, since it was never dispatched on the element.
const coverImgRef = useTemplateRef<{ imgEl?: HTMLImageElement | null }>("coverImg");

function onCoverLoad() {
  const img = coverImgRef.value?.imgEl;
  if (!img) return;
  if (img.naturalWidth < MIN_VALID_COVER_DIMENSION || img.naturalHeight < MIN_VALID_COVER_DIMENSION) {
    handleCoverFailure();
  }
}

const alt = computed(() => `${props.item.workTitle} cover`);
const to = computed(() => `/works/${props.item.workSlug}`);

const showRemoveModal = ref(false);
</script>

<template>
  <!-- Sibling of the NuxtLink, not nested inside it - a <button> can't
       validly nest inside an <a>, so the remove control sits alongside it
       in a shared relative container instead. -->
  <div class="group relative">
    <!-- Deliberately not ImageThumbnail here - its size="full" forces a
         fixed aspect-[2/3] crop, which would make every tile the same
         height and defeat the point of the masonry columns (see design.md
         "Bookshelf tiles render at each cover's natural aspect ratio").
         Rendering at natural size is what gives the column layout real
         heights to pack. -->
    <NuxtLink :to="to" class="block overflow-hidden rounded bg-elevated">
      <div
        v-if="!coverSrc || hasError"
        class="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 p-3 text-center"
      >
        <UIcon name="i-lucide-book" class="size-8 shrink-0 text-muted" />
        <p class="line-clamp-4 text-xs font-medium text-muted">{{ item.workTitle }}</p>
      </div>
      <NuxtImg
        v-else
        ref="coverImg"
        provider="none"
        :src="coverSrc"
        :alt="alt"
        loading="lazy"
        class="block w-full transition-opacity group-hover:opacity-80"
        @load="onCoverLoad"
        @error="handleCoverFailure"
      />
    </NuxtLink>

    <UButton
      v-if="isOwner"
      icon="i-lucide-x"
      color="neutral"
      variant="solid"
      size="xs"
      class="absolute right-1 top-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      :aria-label="`Remove ${item.workTitle} from your shelf`"
      @click="showRemoveModal = true"
    />

    <ProfileBookshelfRemoveModal
      v-if="isOwner"
      v-model:open="showRemoveModal"
      :item="item"
      @removed="emit('removed')"
    />
  </div>
</template>
