<script setup lang="ts">
import type { ReadListEntry } from '~/composables/useBooks'

const { profile, isOwner } = useViewedProfile()

const title = computed(() => (isOwner.value ? 'Read List' : `${profile.username}'s Read List`))
const emptyDescription = computed(() =>
  isOwner.value
    ? 'King works you mark want-to-read will show up here.'
    : `${profile.username} hasn't marked anything want-to-read yet.`
)

const { fetchReadList, fetchUserBooks } = useBooks()

// Always query, even for a private profile viewed by its own owner mid-
// transition - RLS on user_books is the actual gate (see
// supabase-conventions), and the by-username leaf pages already refuse to
// render this tab at all for a non-owner visitor when the profile is
// private (RouteChrome's isPrivate prop, set via useProfileRouteByUsername).
const { data: works } = await useAsyncData(`profile-${profile.id}-read-list`, () =>
  fetchReadList(profile.id)
)

// Populates userBooksByWorkId so each item's BookReadingActions reflects
// the *viewer's own* want-to-read/owned/read state for that work - same as
// every other bibliography-browsing page, regardless of whose list this is.
await useAsyncData('user-books', fetchUserBooks)
</script>

<template>
  <BibliographyBrowsePage
    :title="title"
    description="King works marked want-to-read."
    detail-path-prefix="/works"
    :items="works ?? []"
    :year-of="(work: ReadListEntry) => Number(work.publishDate.slice(0, 4))"
    :image-src-of="
      (work: ReadListEntry) =>
        work.coverId ? getOpenLibraryCoverUrl(work.coverId, 'M') : null
    "
    :image-alt-of="(work: ReadListEntry) => `${work.title} cover`"
    placeholder-icon="i-lucide-book-open-check"
    sort-year-label="Release year"
    :show-sort="false"
    empty-icon="i-lucide-book-open-check"
    empty-title="Nothing queued to read"
    :empty-description="emptyDescription"
  >
    <template #item-actions="{ item }">
      <BookReadingActions
        :work-id="(item as ReadListEntry).id"
        :work-title="(item as ReadListEntry).title"
        :publish-date="(item as ReadListEntry).publishDate"
        mode="compact"
      />
    </template>
  </BibliographyBrowsePage>
</template>
