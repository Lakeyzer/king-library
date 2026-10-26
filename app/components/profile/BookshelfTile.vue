<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ProfileBookshelfItem } from '~/components/profile/Bookshelf.vue'
import type { CopyDetailsTarget } from '~/components/book/CopyDetailsModal.vue'
import type { CopyDetails } from '~/utils/copyFormat'

interface Props {
  item: ProfileBookshelfItem
  isOwner: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ removed: [], updated: [details: CopyDetails] }>()

// Cover-resolution order: an edition tile tries its own cover first (built
// from a stored id, same as getOpenLibraryCoverUrl); if that edition has no
// cover art on file - or the work never had an edition picked at all - fall
// back to the work's own Open Library cover, fetched live since it isn't
// stored anywhere (see supabase-conventions "Cover images"). Only once both
// of those are unavailable does the tile fall back to an icon + title.
const coverSrc = ref<string | null>(
  props.item.kind === 'edition' ? getEditionCoverUrl(props.item.editionId, 'M') : null
)

const triedWorkFallback = ref(false)
// Whether a work-cover fallback is even worth attempting - only an edition
// tile with a known Open Library work key has anywhere left to fall back to
// (a work tile's own cover attempt already *is* the work-cover attempt).
const canTryWorkFallback = computed(
  () => props.item.kind === 'edition' && !triedWorkFallback.value && !!props.item.openLibraryWorkKey
)

async function tryWorkCoverFallback() {
  triedWorkFallback.value = true
  coverSrc.value = props.item.openLibraryWorkKey
    ? await getWorkCoverUrl(props.item.openLibraryWorkKey, 'M')
    : null
}

onMounted(() => {
  if (props.item.kind === 'work') tryWorkCoverFallback()
})

const hasError = ref(false)
watch(coverSrc, () => {
  hasError.value = false
})

// Open Library's covers API doesn't 404 for an id with no cover art on file
// - it returns a 1x1 pixel GIF with a 200 status instead, which never fires
// @error. Treating a suspiciously tiny loaded image as "no cover" catches
// that case too, alongside a genuine load failure - and, for an edition
// tile with somewhere left to fall back to, triggers the work-cover
// fallback above rather than giving up immediately.
const MIN_VALID_COVER_DIMENSION = 4

function handleCoverFailure() {
  if (canTryWorkFallback.value) {
    tryWorkCoverFallback()
  } else {
    hasError.value = true
  }
}

// Read the loaded image off NuxtImg's exposed element rather than
// event.target: when the SSR'd cover is already in the browser cache (the
// common case on a full page refresh), NuxtImg's mounted hook sees the
// underlying <img> as already complete and emits a synthetic
// `new Event("load")` instead of a real DOM event - whose target is always
// null, since it was never dispatched on the element.
const coverImgRef = useTemplateRef<{ imgEl?: HTMLImageElement | null }>('coverImg')

function onCoverLoad() {
  const img = coverImgRef.value?.imgEl
  if (!img) return
  if (img.naturalWidth < MIN_VALID_COVER_DIMENSION || img.naturalHeight < MIN_VALID_COVER_DIMENSION) {
    handleCoverFailure()
  }
}

const alt = computed(() => `${props.item.workTitle} cover`)
const to = computed(() => workPath(props.item.workKind, props.item.workSlug))

const showRemoveModal = ref(false)

// Every tile gets a spine carrying the copy's format (or, when none is set,
// the work's title, like a real spine) and, at its foot, the limited, signed
// and gold/silver first-edition marks - see profile-showcase "Bookshelf
// tiles show a spine". Shown to every visitor, not just the owner.
const spineLabel = computed(() => {
  const format = props.item.copyDetails.copy_format
  return format ? COPY_FORMAT_LABEL[format] : null
})

const mark = computed(() => copyMark(props.item.copyDetails))
const markLabel = computed(() => copyMarkLabel(props.item.copyDetails))
// Above signed, so the foot reads limited, signed, then the edition mark.
const limitedLabel = computed(() => limitedEditionLabel(props.item.copyDetails))
// Bare coloured icons, no badge. Theme tokens rather than dark: variants,
// since the app switches theme via the .dark class (see main.css): silver
// is text-highlighted (white in dark mode), signed text-toned (light grey
// in dark mode). Gold reads on both spine shades as-is.
const MARK_CLASS = {
  gold: 'text-amber-500',
  silver: 'text-highlighted'
} as const

// An edition tile's details live on its user_book_editions row, a work
// tile's on its user_books row.
const showEditModal = ref(false)
const editTarget = computed<CopyDetailsTarget>(() =>
  props.item.kind === 'edition'
    ? { kind: 'edition', editionRowId: props.item.editionRowId }
    : { kind: 'work', workId: props.item.workId }
)
// Owner actions behind the same subtle ellipsis menu the app uses for
// per-item actions elsewhere (ReadingActions, WatchActions, profile Header).
const ownerMenuItems: DropdownMenuItem[] = [
  { label: 'Edit copy details', icon: 'i-lucide-pencil', onSelect: () => (showEditModal.value = true) },
  { label: 'Remove from shelf', icon: 'i-lucide-trash-2', onSelect: () => (showRemoveModal.value = true) }
]

const editSubtitle = computed(() => (props.item.kind === 'edition' ? props.item.editionTitle : props.item.workTitle))
</script>

<template>
  <!-- Sibling of the NuxtLink, not nested inside it - a <button> can't
       validly nest inside an <a>, so the owner actions menu sits alongside it
       in a shared relative container instead. -->
  <div class="group relative drop-shadow-[0_6px_5px_rgb(0_0_0/0.35)]">
    <!-- Deliberately not ImageThumbnail here - its size="full" forces a
         fixed aspect-[2/3] crop, which would make every tile the same
         height and defeat the point of the masonry columns (see design.md
         "Bookshelf tiles render at each cover's natural aspect ratio").
         Rendering at natural size is what gives the column layout real
         heights to pack. -->
    <NuxtLink
      :to="to"
      class="flex overflow-hidden rounded bg-elevated"
    >
      <!-- The spine stretches to the cover's natural height (the flex row's
           default align-items: stretch). contain-size stops its own content
           from counting towards that height - without it, a long title
           would stretch the row past the cover instead of truncating - so
           it never affects the masonry heights. vertical-rl turns the format
           90 degrees clockwise, the way a spine title reads. The owner's
           spine starts its label lower, leaving room for the actions menu
           laid over its top (see below). -->
      <div
        class="flex w-7 shrink-0 flex-col items-center justify-between gap-2 border-r border-default bg-accented px-1 pb-2 contain-size"
        :class="isOwner ? 'pt-6' : 'pt-2'"
      >
        <!-- min-h-0 + flex-1 bounds the label group to the spine's free
             height, so a long title or format is cut off with an ellipsis
             rather than running into the marks below. The dust jacket icon
             follows the label directly, upright. -->
        <div class="flex min-h-0 flex-1 flex-col items-center gap-1">
          <span
            v-if="spineLabel"
            class="min-h-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] uppercase tracking-widest text-muted [writing-mode:vertical-rl]"
            :class="item.copyDetails.copy_format === 'hardcover' ? 'font-bold' : 'font-normal'"
          >{{ spineLabel }}</span>
          <span
            v-else
            class="min-h-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-muted [writing-mode:vertical-rl]"
          ><NumberMotif :text="item.workTitle" /></span>

          <UTooltip
            v-if="item.copyDetails.copy_dust_jacket"
            text="Dust jacket"
          >
            <span
              role="img"
              aria-label="Dust jacket"
              class="flex shrink-0 text-muted"
            >
              <UIcon
                name="i-lucide-book-open"
                class="size-3"
              />
            </span>
          </UTooltip>
        </div>

        <div
          v-if="mark || item.copyDetails.copy_signed || limitedLabel"
          class="flex flex-col items-center gap-1"
        >
          <UTooltip
            v-if="limitedLabel"
            :text="limitedLabel"
          >
            <span
              role="img"
              :aria-label="limitedLabel"
              class="flex text-toned"
            >
              <UIcon
                name="i-lucide-gem"
                class="size-4"
              />
            </span>
          </UTooltip>
          <UTooltip
            v-if="item.copyDetails.copy_signed"
            text="Signed"
          >
            <span
              role="img"
              aria-label="Signed"
              class="flex text-toned"
            >
              <UIcon
                name="i-lucide-signature"
                class="size-4"
              />
            </span>
          </UTooltip>
          <UTooltip
            v-if="mark"
            :text="markLabel!"
          >
            <span
              role="img"
              :aria-label="markLabel!"
              class="flex"
              :class="MARK_CLASS[mark]"
            >
              <UIcon
                name="i-lucide-award"
                class="size-4"
              />
            </span>
          </UTooltip>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div
          v-if="!coverSrc || hasError"
          class="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 p-3 text-center"
        >
          <UIcon
            name="i-lucide-book"
            class="size-8 shrink-0 text-muted"
          />
          <p class="line-clamp-4 text-xs font-medium text-muted"><NumberMotif :text="item.workTitle" /></p>
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
      </div>
    </NuxtLink>

    <!-- Laid over the top of the spine rather than inside it, since the
         spine is part of the NuxtLink and a button can't nest in an <a>.
         Always visible, so the label always has room reserved below it. -->
    <div
      v-if="isOwner"
      class="absolute left-0 top-1 flex w-7 justify-center"
    >
      <UDropdownMenu
        :items="ownerMenuItems"
        :content="{ align: 'end' }"
      >
        <!-- variant="link" + p-0: just the icon, like the spine's marks, while
             staying a real button for keyboard and screen-reader use. -->
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="link"
          size="xs"
          class="p-0"
          :aria-label="`Shelf actions for ${item.workTitle}`"
        />
      </UDropdownMenu>
    </div>

    <BookCopyDetailsModal
      v-if="isOwner"
      v-model:open="showEditModal"
      :target="editTarget"
      :details="item.copyDetails"
      :subtitle="editSubtitle"
      @saved="(details) => emit('updated', details)"
    />

    <ProfileBookshelfRemoveModal
      v-if="isOwner"
      v-model:open="showRemoveModal"
      :item="item"
      @removed="emit('removed')"
    />
  </div>
</template>
