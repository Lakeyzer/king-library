<script setup lang="ts">
import type { CurrentlyReadingWork } from '~/composables/useBooks'
import type { CurrentlyReadingRelatedWork } from '~/composables/useRelatedWorks'

// `source` distinguishes a King work from a Works by Others one - only for
// building the right /works/ vs /works-by-others/ link and picking which
// composable BookFinishReadingModal's domain prop should write through.
// Both finish through the same modal - see profile-showcase's design.md
// "Currently Reading always includes By Other Hands works".
export type CurrentlyReadingItem
  = | (CurrentlyReadingWork & { source: 'king' })
    | (CurrentlyReadingRelatedWork & { source: 'related' })

interface Props {
  items: CurrentlyReadingItem[]
  isOwner: boolean
}

const props = defineProps<Props>()

function itemHref(item: CurrentlyReadingItem) {
  return item.source === 'king' ? `/works/${item.slug}` : `/works-by-others/${item.slug}`
}

// `props.items` is a snapshot fetched once by the profile page
// (fetchCurrentlyReading/fetchCurrentlyReadingRelatedWorks), not derived
// from useBooks()/useRelatedWorks()'s own reactive state - finishing or
// stopping a read here updates that reactive state, but wouldn't otherwise
// be reflected in this list without a full page refetch. Tracking resolved
// ids locally and filtering them out is a lighter fix than threading a
// refetch callback all the way back up through ProfileShowcase.
const resolvedWorkIds = ref(new Set<string>())

const visibleItems = computed(() => props.items.filter(item => !resolvedWorkIds.value.has(item.id)))

function markResolved(workId: string | null) {
  if (!workId) return
  resolvedWorkIds.value = new Set(resolvedWorkIds.value).add(workId)
}

const finishingWorkId = ref<string | null>(null)

const finishingWork = computed(
  () => props.items.find(item => item.id === finishingWorkId.value) ?? null
)

const showFinishModal = computed({
  get: () => finishingWorkId.value !== null,
  set: (value: boolean) => {
    if (!value) finishingWorkId.value = null
  }
})
</script>

<template>
  <!--
    ring-primary/30 is the one deliberate visual difference from the
    recommendation cards it otherwise matches exactly (same bg-elevated
    box, same WorkTile-style rows) - a subtle colored outline so an
    in-progress read stands out from a mere suggestion, without a banner
    or background-color change loud enough to fight the rest of the
    sidebar for attention.
  -->
  <div class="flex flex-col gap-3 rounded-lg bg-elevated p-4 ring-1 ring-primary/30">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon
        name="i-lucide-book-open-text"
        class="size-4 text-primary"
      />
      Currently Reading
    </h2>

    <UEmpty
      v-if="!visibleItems.length"
      icon="i-lucide-book-open"
      title="Not reading anything right now"
      description="Start a book to see it show up here."
    />

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="flex items-center gap-2"
      >
        <NuxtLink
          :to="itemHref(item)"
          class="group flex min-w-0 flex-1 items-center gap-2"
        >
          <ImageThumbnail
            :src="item.coverId ? getOpenLibraryCoverUrl(item.coverId, 'S') : null"
            :alt="`${item.title} cover`"
            placeholder-icon="i-lucide-book"
            size="xs"
          />

          <div class="flex min-w-0 flex-1 flex-col">
            <p class="truncate text-sm font-medium text-highlighted group-hover:text-primary">
              <NumberMotif :text="item.title" />
            </p>
            <p
              v-if="item.format"
              class="flex items-center gap-1 text-xs text-muted"
            >
              <UIcon
                :name="READ_FORMAT_ICON[item.format]"
                class="size-3"
              />
              {{ READ_FORMAT_LABEL[item.format] }}
            </p>
          </div>
        </NuxtLink>

        <UButton
          v-if="isOwner"
          icon="i-lucide-check"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
          aria-label="Finish reading"
          @click="finishingWorkId = item.id"
        />
      </div>
    </div>

    <BookFinishReadingModal
      v-if="finishingWorkId && finishingWork"
      v-model:open="showFinishModal"
      :domain="finishingWork.source"
      :work-id="finishingWorkId"
      :work-title="finishingWork.title"
      :initial-format="finishingWork.format"
      :initial-started-on="finishingWork.source === 'related' ? finishingWork.startedOn : null"
      @resolved="markResolved(finishingWorkId)"
    />
  </div>
</template>
