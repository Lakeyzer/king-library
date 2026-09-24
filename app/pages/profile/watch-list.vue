<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Watch List',
  description: 'Every Stephen King adaptation you want to watch.'
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
    <ProfileWatchListTab />
  </ProfileRouteChrome>
</template>
