<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: false })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Following',
  description: 'See who you follow and who follows you on King Library, and what the people you follow are currently reading.'
})

const PAGE_SIZE = 15

type FollowTab = 'following' | 'followers'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Synced to ?tab= so a link (e.g. the new-follower email) can open the
// Followers tab. Anything but "followers" reads as the default tab.
const activeTab = computed<FollowTab>({
  get: () => route.query.tab === 'followers' ? 'followers' : 'following',
  set: (tab) => {
    router.replace({ query: { ...route.query, tab: tab === 'following' ? undefined : tab } })
  }
})

const { fetchFollowing, fetchFollowers, fetchFollowingIds, fetchFollowingCurrentlyReading, follow } = useFollowing()

// Each tab keeps its own page.
const followingPage = ref(1)
const followersPage = ref(1)

const [
  { data: following },
  { data: followers },
  { data: followingIds },
  { data: currentlyReading }
] = await Promise.all([
  useAsyncData(
    'following-list',
    () => fetchFollowing({ page: followingPage.value, pageSize: PAGE_SIZE }),
    { watch: [followingPage] }
  ),
  useAsyncData(
    'followers-list',
    () => fetchFollowers({ page: followersPage.value, pageSize: PAGE_SIZE }),
    { watch: [followersPage] }
  ),
  useAsyncData('following-ids', () => fetchFollowingIds()),
  useAsyncData('following-currently-reading', () => fetchFollowingCurrentlyReading())
])

// Each count is the list's full total (count: 'exact'), not just the
// current page, and updates when a list refreshes (e.g. after a follow back).
const tabs = computed<TabsItem[]>(() => [
  {
    label: 'Following',
    value: 'following',
    icon: 'i-lucide-user-check',
    slot: 'following',
    badge: { label: String(following.value?.total ?? 0), color: 'neutral', variant: 'soft' }
  },
  {
    label: 'Followers',
    value: 'followers',
    icon: 'i-lucide-users',
    slot: 'followers',
    badge: { label: String(followers.value?.total ?? 0), color: 'neutral', variant: 'soft' }
  }
])

const followBackLoadingId = ref<string | null>(null)

function isFollowed(profileId: string) {
  return followingIds.value?.has(profileId) ?? false
}

async function followBack(profileId: string) {
  followBackLoadingId.value = profileId

  try {
    await follow(profileId)
    followingIds.value = new Set([...followingIds.value ?? [], profileId])
    await refreshNuxtData(['following-list', 'following-currently-reading'])
  } catch {
    toast.add({
      title: 'Could not follow this user',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    followBackLoadingId.value = null
  }
}

function compareUrl(username: string | null) {
  return `/profile/${(username ?? '').toLowerCase()}/compare`
}
</script>

<template>
  <NuxtLayout name="detail">
    <h1 class="text-xl font-semibold mb-6">
      Following
    </h1>

    <UTabs
      v-model="activeTab"
      :items="tabs"
      variant="link"
      class="w-full"
      :ui="{ content: 'pt-4' }"
    >
      <template #following>
        <FollowingUserList
          v-model:page="followingPage"
          :entries="following?.entries ?? []"
          :total="following?.total ?? 0"
          :page-size="PAGE_SIZE"
          empty-icon="i-lucide-user-check"
          empty-title="You're not following anyone yet"
          empty-description="Follow other users from their profile to see them here."
        >
          <template #actions="{ profile }">
            <UButton
              label="Compare"
              icon="i-lucide-arrow-left-right"
              color="neutral"
              variant="subtle"
              size="sm"
              :to="compareUrl(profile.username)"
            />
          </template>
        </FollowingUserList>
      </template>

      <template #followers>
        <FollowingUserList
          v-model:page="followersPage"
          :entries="followers?.entries ?? []"
          :total="followers?.total ?? 0"
          :page-size="PAGE_SIZE"
          empty-icon="i-lucide-users"
          empty-title="No followers yet"
          empty-description="When someone follows you, they'll show up here."
        >
          <template #actions="{ profile }">
            <UBadge
              v-if="isFollowed(profile.id)"
              label="Following"
              icon="i-lucide-check"
              color="neutral"
              variant="soft"
            />
            <UButton
              v-else
              label="Follow back"
              icon="i-lucide-user-plus"
              size="sm"
              :loading="followBackLoadingId === profile.id"
              @click="followBack(profile.id)"
            />
            <UButton
              label="Compare"
              icon="i-lucide-arrow-left-right"
              color="neutral"
              variant="subtle"
              size="sm"
              :to="compareUrl(profile.username)"
            />
          </template>
        </FollowingUserList>
      </template>
    </UTabs>

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
