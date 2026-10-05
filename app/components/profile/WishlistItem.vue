<script setup lang="ts">
import type { WishlistEntry } from '~/composables/useWishlist'

interface Props {
  entry: WishlistEntry
  /** Shows edit/remove controls - only for the profile owner (wishlist "Only the owner can change entries from the Wishlist tab"). */
  editable?: boolean
  /** Tags currently selected in the tab's filter, highlighted on the entry. */
  activeTags?: string[]
  removing?: boolean
}

withDefaults(defineProps<Props>(), {
  editable: false,
  activeTags: () => [],
  removing: false
})

const emit = defineEmits<{ edit: [], remove: [] }>()
</script>

<template>
  <li class="flex items-start gap-3 py-3 pl-3 pr-3">
    <NuxtLink
      :to="workPath(entry.work.kind, entry.work.slug)"
      class="shrink-0"
    >
      <ImageThumbnail
        :src="entry.work.coverId ? getOpenLibraryCoverUrl(entry.work.coverId, 'M') : null"
        :alt="`${entry.work.title} cover`"
        placeholder-icon="i-lucide-heart"
        size="sm"
      />
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <NuxtLink
        :to="workPath(entry.work.kind, entry.work.slug)"
        class="block truncate font-medium text-highlighted hover:text-primary"
      >
        <NumberMotif :text="entry.work.title" />
      </NuxtLink>
      <p
        v-if="entry.note"
        class="mt-1 whitespace-pre-line text-sm text-default"
      >
        <NumberMotif :text="entry.note" />
      </p>
      <div
        v-if="entry.tags.length"
        class="mt-2 flex flex-wrap gap-1"
      >
        <UBadge
          v-for="tag in entry.tags"
          :key="tag"
          :label="wishlistTagLabel(tag)"
          :color="activeTags.includes(tag) ? 'primary' : 'neutral'"
          variant="subtle"
          size="sm"
        />
      </div>
    </div>

    <div
      v-if="editable"
      class="flex shrink-0 gap-1"
    >
      <UButton
        icon="i-lucide-pencil"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Edit entry"
        @click="emit('edit')"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Remove entry"
        :loading="removing"
        @click="emit('remove')"
      />
    </div>
  </li>
</template>
