<script setup lang="ts">
import type { Profile } from "~/composables/useProfile";

interface Props {
  profile: Profile;
  isOwner: boolean;
  isPrivate: boolean;
  /** "/profile" for the signed-in user's own routes, "/profile/[username]" for a viewed profile's. */
  basePath: string;
}

defineProps<Props>();
</script>

<template>
  <div class="py-8 flex flex-col gap-6">
    <ProfileHeader
      :profile-id="profile.id"
      :username="profile.username ?? ''"
      :avatar-url="profile.avatar_url"
      :tagline="profile.tagline"
      :is-owner="isOwner"
      :is-public="profile.is_public"
    />

    <UEmpty
      v-if="isPrivate"
      icon="i-lucide-eye-off"
      title="This profile is private"
      description="The owner of this profile has chosen to keep it private."
    />
    <template v-else>
      <ProfileTabs :base-path="basePath" />
      <slot />
    </template>
  </div>
</template>
