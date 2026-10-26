<script setup lang="ts">
import type { CopyDetails, CopyFormat } from '~/utils/copyFormat'

// Shared by CopyDetailsModal (after adding an edition, and editing a shelf
// tile) and the editions picker's edition-less "On my shelf" form - see
// add-bookshelf-copy-details's design.md "One form component, three hosts".
const details = defineModel<CopyDetails>({ required: true })

// USelect items can't carry a null value, so "Not set" gets its own
// sentinel, mapped to/from null here.
const NOT_SET = 'not-set'
const formatItems = [{ label: 'Not set', value: NOT_SET, icon: 'i-lucide-circle-dashed' }, ...COPY_FORMAT_OPTIONS]

const isPhysical = computed(() => isPhysicalCopyFormat(details.value.copy_format))
const isHardcover = computed(() => details.value.copy_format === 'hardcover')

// Switching format clears whatever the new format rules out (edition,
// printing, signed and limited off a physical format; dust jacket and book
// club off a hardcover), matching the database's checks.
function setFormat(value: string) {
  const format = value === NOT_SET ? null : (value as CopyFormat)
  details.value = normalizeCopyDetails({ ...details.value, copy_format: format })
}

function setNumber(
  field: 'copy_edition' | 'copy_printing' | 'copy_limited_size',
  value: number | null | undefined
) {
  details.value = { ...details.value, [field]: value && value >= 1 ? Math.floor(value) : null }
}

function setFlag(field: 'copy_signed' | 'copy_dust_jacket' | 'copy_book_club', value: boolean | 'indeterminate') {
  details.value = { ...details.value, [field]: value === true }
}

// Unticking limited clears its number and size too.
function setLimited(value: boolean | 'indeterminate') {
  details.value = normalizeCopyDetails({ ...details.value, copy_limited: value === true })
}

// Kept as typed (uppercased) while editing, so a half-typed value isn't
// wiped - normalizeCopyDetails drops an invalid one on save, and the field
// shows an error until then.
function setLimitedNumber(value: string) {
  details.value = { ...details.value, copy_limited_number: value.trim().toUpperCase() || null }
}

const limitedNumberError = computed(() => {
  const number = details.value.copy_limited_number
  return number && !LIMITED_NUMBER_PATTERN.test(number) ? 'Use up to 6 letters or digits, e.g. 123 or AA' : undefined
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField label="Format">
      <USelect
        :model-value="details.copy_format ?? NOT_SET"
        :items="formatItems"
        class="w-48"
        @update:model-value="(value) => setFormat(value as string)"
      />
    </UFormField>

    <template v-if="isPhysical">
      <div class="flex flex-wrap gap-4">
        <UFormField
          label="Edition"
          description="Optional - 1 for a first edition"
        >
          <UInputNumber
            :model-value="details.copy_edition"
            :min="1"
            placeholder="-"
            class="w-32"
            @update:model-value="(value) => setNumber('copy_edition', value)"
          />
        </UFormField>

        <UFormField
          label="Printing"
          description="Optional - 1 for a first printing"
        >
          <UInputNumber
            :model-value="details.copy_printing"
            :min="1"
            placeholder="-"
            class="w-32"
            @update:model-value="(value) => setNumber('copy_printing', value)"
          />
        </UFormField>
      </div>

      <UCheckbox
        :model-value="details.copy_signed"
        label="Signed"
        @update:model-value="(value) => setFlag('copy_signed', value)"
      />

      <template v-if="isHardcover">
        <UCheckbox
          :model-value="details.copy_dust_jacket"
          label="Dust jacket"
          description="The paper jacket is with the book"
          @update:model-value="(value) => setFlag('copy_dust_jacket', value)"
        />
        <UCheckbox
          :model-value="details.copy_book_club"
          label="Book club edition"
          description="A book club printing - never counted as a true first edition"
          @update:model-value="(value) => setFlag('copy_book_club', value)"
        />
      </template>

      <UCheckbox
        :model-value="details.copy_limited"
        label="Limited edition"
        description="A numbered or lettered limited run"
        @update:model-value="setLimited"
      />

      <div
        v-if="details.copy_limited"
        class="flex flex-wrap gap-4"
      >
        <UFormField
          label="Copy number"
          description="Optional - e.g. 123, or AA if lettered"
          :error="limitedNumberError"
        >
          <UInput
            :model-value="details.copy_limited_number ?? ''"
            :maxlength="6"
            placeholder="-"
            class="w-32"
            @update:model-value="(value) => setLimitedNumber(String(value))"
          />
        </UFormField>

        <UFormField
          label="Edition size"
          description="Optional - copies in the run"
        >
          <UInputNumber
            :model-value="details.copy_limited_size"
            :min="1"
            placeholder="-"
            class="w-32"
            @update:model-value="(value) => setNumber('copy_limited_size', value)"
          />
        </UFormField>
      </div>
    </template>
  </div>
</template>
