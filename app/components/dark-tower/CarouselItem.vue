<script setup lang="ts">
import type { KingWork } from '~/composables/useKingWorks'

interface Props {
  work: KingWork
}

defineProps<Props>()

function stephenKingByline(work: KingWork) {
  return work.co_author
    ? `By Stephen King & ${work.co_author}`
    : 'By Stephen King'
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 sm:flex-row">
    <NuxtLink
      :to="`/works/${work.slug}`"
      class="group mx-auto shrink-0 sm:mx-0"
    >
      <div
        class="flex h-72 w-48 items-center justify-center overflow-hidden rounded-lg bg-default"
      >
        <UIcon
          v-if="!work.cover_id"
          name="i-lucide-book"
          class="size-12 text-muted"
        />
        <NuxtImg
          v-else
          provider="none"
          :src="getOpenLibraryCoverUrl(work.cover_id, 'L')"
          :alt="`${work.title} cover`"
          class="h-full w-full object-cover"
        />
      </div>
    </NuxtLink>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div>
        <NuxtLink
          :to="`/works/${work.slug}`"
          class="group"
        >
          <h3
            class="text-xl font-bold text-highlighted group-hover:text-primary"
          >
            <NumberMotif :text="work.title" />
          </h3>
        </NuxtLink>
        <p class="text-xs text-muted">
          <NumberMotif :text="stephenKingByline(work)" />
        </p>
        <p class="mt-2 flex items-center gap-4 text-muted">
          <NumberMotif :text="Number(work.publish_date.slice(0, 4))" />
          <span><NumberMotif :text="formatTypeLabel(work.type)" /></span>
        </p>
      </div>

      <p
        v-if="work.description"
        class="line-clamp-3 text-sm text-muted"
      >
        <NumberMotif :text="work.description" />
      </p>

      <BookReadingActions
        :work-id="work.id"
        :work-title="work.title"
        :work-key="work.open_library_work_key"
        mode="expanded"
      />
    </div>
  </div>
</template>
