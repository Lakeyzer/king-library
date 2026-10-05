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
  title: `${profile.username}'s Wishlist`,
  description: `See the editions and copies ${profile.username} is hunting for on King Library.`
})
</script>

<template>
  <ProfileRouteChrome
    :profile="profile"
    :is-owner="isOwner"
    :is-private="isPrivate"
    :base-path="`/profile/${username}`"
  >
    <ProfileWishlistTab />
  </ProfileRouteChrome>
</template>
