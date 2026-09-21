<script setup lang="ts">
import type { ReadFormat } from "~/composables/useBooks";

// Shared by MarkReadModal and FinishReadingModal (and reused for the
// "read again" flow via MarkReadModal's variant prop) - see
// add-reread-tracking's design.md "Read-again reuses the mark-read-directly
// prompt". Kept as its own component rather than duplicated markup since
// both modals need the exact same three optional fields.
const NOTE_MAX_LENGTH = 200;

const note = defineModel<string>("note", { default: "" });
const format = defineModel<ReadFormat | null>("format", { default: null });
const rating = defineModel<number | null>("rating", { default: null });

function toggleRating(star: number) {
  rating.value = rating.value === star ? null : star;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField label="Rating" description="Optional">
      <div class="flex gap-1">
        <UButton
          v-for="star in 5"
          :key="star"
          icon="i-lucide-star"
          size="sm"
          :color="star <= (rating ?? 0) ? 'warning' : 'neutral'"
          :variant="star <= (rating ?? 0) ? 'solid' : 'ghost'"
          :aria-label="`Rate ${star} star${star > 1 ? 's' : ''}`"
          @click="toggleRating(star)"
        />
      </div>
    </UFormField>

    <UFormField label="Format" description="Optional">
      <USelect
        :model-value="format ?? undefined"
        :items="READ_FORMAT_OPTIONS"
        placeholder="Select format"
        class="w-48"
        @update:model-value="(value) => (format = (value as ReadFormat | undefined) ?? null)"
      />
    </UFormField>

    <UFormField label="Note" :description="`Optional - max ${NOTE_MAX_LENGTH} characters`">
      <UTextarea v-model="note" :maxlength="NOTE_MAX_LENGTH" :rows="3" class="w-full" />
    </UFormField>
  </div>
</template>
