<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

interface Props {
  /** Active King works with a non-null dark_tower_relation - the caller is
   * responsible for that filtering (see design.md "Related-works research"). */
  works: KingWork[];
}

defineProps<Props>();
</script>

<template>
  <ul class="w-full divide-y divide-accented">
    <BibliographyListItem
      v-for="work in works"
      :key="work.id"
      :src="work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, 'M') : null"
      :image-alt="`${work.title} cover`"
      placeholder-icon="i-lucide-book"
      :title="work.title"
      :release-year="Number(work.publish_date.slice(0, 4))"
      :type-label="formatTypeLabel(work.type)"
      :to="`/works/${work.slug}`"
      :note="work.dark_tower_relation"
    >
      <template #actions>
        <BookReadingActions
          :work-id="work.id"
          :work-title="work.title"
          :work-key="work.open_library_work_key"
        />
      </template>
    </BibliographyListItem>
  </ul>
</template>
