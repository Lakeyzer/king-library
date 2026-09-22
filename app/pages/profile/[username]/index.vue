<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const username = route.params.username as string

const { fetchProfileByUsername } = useProfile()
const { data: viewedProfile } = await useAsyncData(`profile-${username}`, () =>
  fetchProfileByUsername(username)
)

if (!viewedProfile.value) {
  throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
}

const { profile, isOwner, isPrivate } = provideViewedProfile(viewedProfile.value)

const { setPageSeo } = useSeo()
setPageSeo({
  title: profile.username ?? username,
  description: `See ${profile.username}'s Stephen King reading stats, watch progress, and bookshelf on King Library.`
})
useSeoMeta({ title: `${profile.username} - Profile` })
</script>

<template>
  <ProfileRouteChrome
    :profile="profile"
    :is-owner="isOwner"
    :is-private="isPrivate"
    :base-path="`/profile/${username}`"
  >
    <ProfileReaderChecklistTab />
  </ProfileRouteChrome>
</template>
