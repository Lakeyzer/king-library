<script setup lang="ts">
definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Reading Timeline",
  description: "Every book you've read, in order.",
});

const { profile: ownProfile } = useProfile();
const { profile, isOwner, isPrivate } = provideViewedProfile(ownProfile.value!);
</script>

<template>
  <ProfileRouteChrome
    :profile="profile"
    :is-owner="isOwner"
    :is-private="isPrivate"
    base-path="/profile"
  >
    <ProfileTimelineTab />
  </ProfileRouteChrome>
</template>
