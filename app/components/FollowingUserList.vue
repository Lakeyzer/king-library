<script setup lang="ts">
import type { FollowEntry } from '~/composables/useFollowing'
import type { Profile } from '~/composables/useProfile'

interface Props {
  entries: FollowEntry[]
  total: number
  pageSize: number
  emptyIcon: string
  emptyTitle: string
  emptyDescription: string
}

defineProps<Props>()

defineSlots<{
  actions?(props: { profile: Profile }): unknown
}>()

// 1-indexed, matching UPagination.
const page = defineModel<number>('page', { required: true })

function profileUrl(profile: Profile) {
  return `/profile/${(profile.username ?? '').toLowerCase()}`
}
</script>

<template>
  <UEmpty
    v-if="!entries.length"
    :icon="emptyIcon"
    :title="emptyTitle"
    :description="emptyDescription"
  />

  <div v-else>
    <ul class="space-y-2">
      <li
        v-for="entry in entries"
        :key="entry.profile.id"
        class="flex items-center gap-3 rounded-lg p-3 bg-elevated hover:bg-elevated/70"
      >
        <UUser
          :name="entry.profile.username ?? ''"
          :description="entry.profile.tagline ?? undefined"
          :avatar="{ src: entry.profile.avatar_url ?? undefined, icon: 'i-lucide-user' }"
          :to="profileUrl(entry.profile)"
          class="min-w-0 flex-1"
        >
          <template #name>
            <NumberMotif :text="entry.profile.username ?? ''" />
          </template>
          <template
            v-if="entry.profile.tagline"
            #description
          >
            <NumberMotif :text="entry.profile.tagline" />
          </template>
        </UUser>

        <div class="flex shrink-0 items-center gap-2">
          <slot
            name="actions"
            :profile="entry.profile"
          />
        </div>
      </li>
    </ul>

    <div
      v-if="total > pageSize"
      class="flex justify-center mt-6"
    >
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="pageSize"
      />
    </div>
  </div>
</template>
