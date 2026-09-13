<script setup lang="ts">
definePageMeta({ layout: false })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Following',
  description: 'See who you follow on King Library and what they\'re currently reading.'
})

const { fetchFollowing, fetchFollowingCurrentlyReading } = useFollowing()

const [{ data: following }, { data: currentlyReading }] = await Promise.all([
  useAsyncData('following-list', () => fetchFollowing()),
  useAsyncData('following-currently-reading', () => fetchFollowingCurrentlyReading())
])
</script>

<template>
  <NuxtLayout name="detail">
    <h1 class="text-xl font-semibold mb-6">
      Following
    </h1>

    <UEmpty
      v-if="!following?.length"
      icon="i-lucide-users"
      title="You're not following anyone yet"
      description="Follow other users from their profile to see them here."
    />

    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="followedProfile in following"
        :key="followedProfile.id"
        class="flex items-center gap-3 rounded-lg p-3 bg-elevated hover:bg-elevated/70"
      >
        <NuxtLink
          :to="`/profile/${(followedProfile.username ?? '').toLowerCase()}`"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <UAvatar
            :src="followedProfile.avatar_url ?? undefined"
            icon="i-lucide-user"
          />
          <div class="min-w-0">
            <p class="font-medium text-highlighted truncate">
              <NumberMotif :text="followedProfile.username ?? ''" />
            </p>
            <p
              v-if="followedProfile.tagline"
              class="text-muted text-sm truncate"
            >
              <NumberMotif :text="followedProfile.tagline" />
            </p>
          </div>
        </NuxtLink>
        <UButton
          label="Compare"
          icon="i-lucide-arrow-left-right"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
          :to="`/profile/${(followedProfile.username ?? '').toLowerCase()}/compare`"
        />
      </li>
    </ul>

    <template #aside>
      <h2 class="font-medium text-highlighted mb-3">
        Currently reading
      </h2>

      <UEmpty
        v-if="!currentlyReading?.length"
        icon="i-lucide-book-open"
        title="Nothing being read right now"
        description="Nothing from the people you follow is currently being read."
      />

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="entry in currentlyReading"
          :key="entry.profile.id"
          class="rounded-lg bg-elevated p-3"
        >
          <NuxtLink
            :to="`/profile/${(entry.profile.username ?? '').toLowerCase()}`"
            class="flex items-center gap-2 mb-2"
          >
            <UAvatar
              :src="entry.profile.avatar_url ?? undefined"
              icon="i-lucide-user"
              size="xs"
            />
            <span class="text-sm font-medium text-highlighted"><NumberMotif :text="entry.profile.username ?? ''" /></span>
          </NuxtLink>

          <ul class="space-y-1">
            <li
              v-for="work in entry.works"
              :key="work.id"
            >
              <NuxtLink
                :to="`/works/${work.slug}`"
                class="text-sm text-muted hover:text-highlighted"
              >
                <NumberMotif :text="work.title" />
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>
