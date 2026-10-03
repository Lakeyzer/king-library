<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Wishlist',
  description: 'The editions and copies you are hunting for.'
})

const { profile: ownProfile } = useProfile()
const { profile, isOwner, isPrivate } = provideViewedProfile(ownProfile.value!)
</script>

<template>
  <ProfileRouteChrome
    :profile="profile"
    :is-owner="isOwner"
    :is-private="isPrivate"
    base-path="/profile"
  >
    <ProfileWishlistTab />
  </ProfileRouteChrome>
</template>
