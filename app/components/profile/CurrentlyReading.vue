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
  <div class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <UEmpty
      v-if="!items.length"
      icon="i-lucide-book-open"
      title="Not reading anything right now"
      description="Start a book to see it show up here."
    />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-2"
      >
        <NuxtLink :to="`/works/${item.slug}`" class="w-20 shrink-0 lg:w-32">
          <ImageThumbnail
            :src="
              item.coverId ? getOpenLibraryCoverUrl(item.coverId, 'M') : null
            "
            :alt="`${item.title} cover`"
            placeholder-icon="i-lucide-book"
            size="full"
          />
        </NuxtLink>

        <div
          class="flex min-w-0 flex-1 flex-col items-start gap-1 lg:flex-none lg:items-center"
        >
          <p
            class="w-full truncate text-sm font-medium text-highlighted lg:hidden"
          >
            {{ item.title }}
          </p>
          <UButton
            v-if="isOwner"
            label="Finish"
            icon="i-lucide-check"
            color="neutral"
            variant="subtle"
            @click="finishingWorkId = item.id"
          />
        </div>
      </div>
    </div>

    <BookFinishReadingModal
      v-if="finishingWorkId && finishingWork"
      v-model:open="showFinishModal"
      :work-id="finishingWorkId"
      :work-title="finishingWork.title"
    />
  </div>
</template>
