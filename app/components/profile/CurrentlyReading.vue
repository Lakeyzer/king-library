<script setup lang="ts">
import type { CurrentlyReadingWork } from "~/composables/useBooks";

interface Props {
  items: CurrentlyReadingWork[];
  isOwner: boolean;
}

const props = defineProps<Props>();

const finishingWorkId = ref<string | null>(null);

const finishingWork = computed(
  () => props.items.find((item) => item.id === finishingWorkId.value) ?? null,
);

const showFinishModal = computed({
  get: () => finishingWorkId.value !== null,
  set: (value: boolean) => {
    if (!value) finishingWorkId.value = null;
  },
});
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
      <UIcon name="i-lucide-book-open-text" class="size-4 text-primary" />
      Currently Reading
    </h2>

    <UEmpty
      v-if="!items.length"
      icon="i-lucide-book-open"
      title="Not reading anything right now"
      description="Start a book to see it show up here."
    />

    <div v-else class="flex flex-col gap-3">
      <div v-for="item in items" :key="item.id" class="flex items-center gap-2">
        <NuxtLink :to="`/works/${item.slug}`" class="group flex min-w-0 flex-1 items-center gap-2">
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
            <p v-if="item.format" class="flex items-center gap-1 text-xs text-muted">
              <UIcon :name="READ_FORMAT_ICON[item.format]" class="size-3" />
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
      :work-id="finishingWorkId"
      :work-title="finishingWork.title"
      :initial-format="finishingWork.format"
    />
  </div>
</template>
