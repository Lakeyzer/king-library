<script setup lang="ts">
import type { ReadFormat } from '~/composables/useBooks'

// Shared by MarkReadModal and FinishReadingModal (and reused for the
// "read again" flow via MarkReadModal's variant prop) - see
// add-reread-tracking's design.md "Read-again reuses the mark-read-directly
// prompt". Kept as its own component rather than duplicated markup since
// both modals need the exact same three optional fields.
const NOTE_MAX_LENGTH = 200

const note = defineModel<string>('note', { default: '' })
const format = defineModel<ReadFormat | null>('format', { default: null })
const rating = defineModel<number | null>('rating', { default: null })
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField
      label="Rating"
      description="Optional"
    >
      <!--
        clearable reproduces the previous hand-rolled toggle (clicking the
        already-selected star clears it back to no rating) via Reka's own
        RatingRoot behavior, rather than a custom click handler - and 0 is
        UInputRating's own "no rating" value, mapped to/from this model's
        null here since the rest of the app (and the DB column) treat an
        absent rating as null, not 0.
      -->
      <UInputRating
        :model-value="rating ?? 0"
        icon="i-lucide-star"
        color="warning"
        clearable
        hoverable
        @update:model-value="(value) => (rating = value || null)"
      />
    </UFormField>

    <UFormField
      label="Format"
      description="Optional"
    >
      <USelect
        :model-value="format ?? undefined"
        :items="READ_FORMAT_OPTIONS"
        placeholder="Select format"
        class="w-48"
        @update:model-value="
          (value) => (format = (value as ReadFormat | undefined) ?? null)
        "
      />
    </UFormField>

    <UFormField
      label="Note"
      :description="`Optional - max ${NOTE_MAX_LENGTH} characters`"
    >
      <UTextarea
        v-model="note"
        :maxlength="NOTE_MAX_LENGTH"
        :rows="3"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
