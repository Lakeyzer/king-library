<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

interface Props {
  work: KingWork;
}

defineProps<Props>();
</script>

<template>
  <UCard
    variant="soft"
    :ui="{ body: 'p-0 sm:p-0', footer: 'flex flex-col gap-1.5 p-2 sm:p-2' }"
  >
    <NuxtLink :to="`/works/${work.slug}`" class="group block">
      <div
        class="flex aspect-2/3 w-full items-center justify-center bg-default"
      >
        <UIcon
          v-if="!work.cover_id"
          name="i-lucide-book"
          class="size-12 text-muted"
        />
        <NuxtImg
          v-else
          provider="none"
          :src="getOpenLibraryCoverUrl(work.cover_id, 'M')"
          :alt="`${work.title} cover`"
          class="h-full w-full object-cover transition-opacity group-hover:opacity-90"
        />
      </div>
    </NuxtLink>

    <template #footer>
      <NuxtLink :to="`/works/${work.slug}`" class="group">
        <p
          class="truncate text-sm font-semibold text-highlighted group-hover:text-primary"
        >
          <NumberMotif :text="work.title" />
        </p>
      </NuxtLink>
      <p
        v-if="work.dark_tower_relation"
        class="line-clamp-2 text-xs text-muted"
      >
        <NumberMotif :text="work.dark_tower_relation" />
      </p>

      <BookReadingActions
        :work-id="work.id"
        :work-title="work.title"
        :work-key="work.open_library_work_key"
        :publish-date="work.publish_date"
        mode="compact"
        size="sm"
        class="self-end"
      />
    </template>
  </UCard>
</template>
