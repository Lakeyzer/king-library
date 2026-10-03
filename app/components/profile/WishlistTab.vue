<script setup lang="ts">
import type { WishlistEntry } from '~/composables/useWishlist'

const { profile, isOwner } = useViewedProfile()
const toast = useToast()

const title = computed(() => (isOwner.value ? 'Wishlist' : `${profile.username}'s Wishlist`))
const emptyDescription = computed(() =>
  isOwner.value
    ? 'Editions and copies you\'re hunting for will show up here. Add one from any work\'s actions.'
    : `${profile.username} hasn't added anything to their wishlist yet.`
)

const { fetchWishlist, fetchOwnWishlist, removeWishlistItem } = useWishlist()

// Always query - RLS on user_wishlist_items is the actual privacy gate (see
// supabase-conventions), and the by-username page already refuses to render
// this tab for a non-owner visitor when the profile is private.
const { data: entries, refresh } = await useAsyncData(`profile-${profile.id}-wishlist`, () =>
  fetchWishlist(profile.id)
)

// The owner's edit dialog reads their own entries (tag suggestions, and the
// by-work store it updates in place), same store BookReadingActions uses.
await useAsyncData('user-wishlist', fetchOwnWishlist)

// Only tags actually in use are offered as filters. Matching is AND: an
// entry is shown only if it carries every selected tag (wishlist "Wishlist
// tab can be filtered by tag").
const selectedTags = ref<string[]>([])

const availableTags = computed(() =>
  [...new Set((entries.value ?? []).flatMap(entry => entry.tags))].sort((a, b) =>
    wishlistTagLabel(a).localeCompare(wishlistTagLabel(b))
  )
)

// Drop selections that disappear after an edit/remove, so the filter never
// hides everything behind a tag nobody can deselect.
watch(availableTags, (tags) => {
  selectedTags.value = selectedTags.value.filter(tag => tags.includes(tag))
})

const filteredEntries = computed(() =>
  (entries.value ?? []).filter(entry => selectedTags.value.every(tag => entry.tags.includes(tag)))
)

function toggleTag(tag: string) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter(selected => selected !== tag)
    : [...selectedTags.value, tag]
}

const editingEntry = ref<WishlistEntry | null>(null)
const showEditModal = ref(false)

function edit(entry: WishlistEntry) {
  editingEntry.value = entry
  showEditModal.value = true
}

const removingId = ref<string | null>(null)

async function remove(entry: WishlistEntry) {
  removingId.value = entry.id
  try {
    await removeWishlistItem(entry.id, entry.work.id)
    await refresh()
    toast.add({ title: 'Removed from wishlist', description: entry.work.title })
  } catch {
    toast.add({ title: 'Could not remove wishlist entry', color: 'error' })
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="py-4">
    <div class="flex gap-2 justify-baseline items-center">
      <UIcon
        name="i-lucide-heart"
        class="text-primary size-6"
      />
      <h1 class="heading-1 grow">
        {{ title }}
      </h1>
      <div class="text-2xl font-bold text-muted">
        <NumberMotif :text="entries?.length ?? 0" />
      </div>
    </div>
    <p class="text-muted italic">
      Editions and copies being hunted for.
    </p>

    <UPageBody>
      <div
        v-if="availableTags.length"
        class="mb-4 flex flex-wrap items-center gap-2"
      >
        <UButton
          v-for="tag in availableTags"
          :key="tag"
          :label="wishlistTagLabel(tag)"
          :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
          :variant="selectedTags.includes(tag) ? 'solid' : 'subtle'"
          size="sm"
          :aria-pressed="selectedTags.includes(tag)"
          @click="toggleTag(tag)"
        />
        <UButton
          v-if="selectedTags.length"
          label="Clear"
          icon="i-lucide-x"
          color="neutral"
          variant="link"
          size="sm"
          @click="selectedTags = []"
        />
      </div>

      <UEmpty
        v-if="!entries?.length"
        icon="i-lucide-heart"
        title="Nothing on the wishlist"
        :description="emptyDescription"
      />
      <UEmpty
        v-else-if="!filteredEntries.length"
        icon="i-lucide-search-x"
        title="No matches"
        description="No entry has every selected tag."
        :actions="[{ label: 'Clear filter', color: 'neutral', variant: 'subtle', onClick: () => { selectedTags = [] } }]"
      />
      <ul
        v-else
        class="w-full divide-y divide-accented"
      >
        <ProfileWishlistItem
          v-for="entry in filteredEntries"
          :key="entry.id"
          :entry="entry"
          :editable="isOwner"
          :active-tags="selectedTags"
          :removing="removingId === entry.id"
          @edit="edit(entry)"
          @remove="remove(entry)"
        />
      </ul>
    </UPageBody>

    <BookWishlistModal
      v-if="editingEntry"
      v-model:open="showEditModal"
      :work-id="editingEntry.work.id"
      :work-title="editingEntry.work.title"
      :edit-item="editingEntry"
      @changed="refresh"
    />
  </div>
</template>
