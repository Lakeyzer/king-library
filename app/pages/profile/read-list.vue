<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Read List',
  description: 'Every Stephen King work you want to read.'
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
    <ProfileReadListTab />
  </ProfileRouteChrome>
</template>
