<script setup lang="ts">
interface Props {
  profileId: string;
  username: string;
  avatarUrl?: string | null;
  tagline?: string | null;
  isOwner: boolean;
  isPublic: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  avatarUrl: null,
  tagline: null,
});

const toast = useToast();

async function shareProfile() {
  // Not window.location.href - the owner's own view can be served from
  // /profile (auth-gated, only resolvable as "you"), so the shareable link
  // always has to be built as the public /profile/[username] URL instead.
  // Lowercased since usernames may contain capitals but /profile/[username]
  // URLs the app generates always use the lowercase form.
  const url = `${window.location.origin}/profile/${props.username.toLowerCase()}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `${props.username}'s King Library profile`, url });
    } catch {
      // The user cancelled the native share sheet - not an error worth surfacing.
    }
    return;
  }

  await navigator.clipboard.writeText(url);
  toast.add({ title: "Link copied to clipboard", icon: "i-lucide-check" });
}

const currentUser = useSupabaseUser();
const { open: openAuthModal } = useAuthModal();
const { isFollowing, follow, unfollow } = useFollowing();

const following = ref(false);
const followLoading = ref(false);

if (!props.isOwner && currentUser.value) {
  isFollowing(props.profileId).then((result) => {
    following.value = result;
  });
}

async function toggleFollow() {
  if (!currentUser.value) {
    openAuthModal();
    return;
  }

  followLoading.value = true;

  try {
    if (following.value) {
      await unfollow(props.profileId);
      following.value = false;
    } else {
      await follow(props.profileId);
      following.value = true;
    }
  } finally {
    followLoading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-4">
    <UAvatar :src="avatarUrl ?? undefined" icon="i-lucide-user" size="xl" />
    <div>
      <h1 class="text-2xl font-bold text-highlighted"><NumberMotif :text="username" /></h1>
      <p class="text-muted text-sm">
        <NumberMotif :text="tagline || 'Stephen King reading showcase'" />
      </p>
    </div>

    <UButton
      v-if="isOwner && isPublic"
      label="Share"
      icon="i-lucide-share-2"
      color="neutral"
      variant="subtle"
      class="ml-auto"
      @click="shareProfile"
    />
    <UBadge
      v-else-if="isOwner"
      label="Private"
      icon="i-lucide-eye-off"
      color="neutral"
      variant="subtle"
      class="ml-auto"
    />
    <UButton
      v-else
      :label="following ? 'Following' : 'Follow'"
      :icon="following ? 'i-lucide-user-check' : 'i-lucide-user-plus'"
      color="neutral"
      variant="subtle"
      class="ml-auto"
      :loading="followLoading"
      @click="toggleFollow"
    />
  </div>
</template>
