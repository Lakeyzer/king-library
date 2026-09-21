<script setup lang="ts">
definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Your Profile",
  description:
    "View your Stephen King reading stats, watch progress, and bookshelf.",
});

// Already loaded by the onboarding middleware before this route renders -
// no fetch needed here.
const { profile: ownProfile } = useProfile();
const { profile, isOwner, isPrivate } = provideViewedProfile(ownProfile.value!);

useSeoMeta({
  title: profile.username ? `${profile.username}` : "Profile",
});
</script>

<template>
  <ProfileRouteChrome
    :profile="profile"
    :is-owner="isOwner"
    :is-private="isPrivate"
    base-path="/profile"
  >
    <ProfileReaderChecklistTab />
  </ProfileRouteChrome>
</template>
