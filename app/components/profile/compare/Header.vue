<script setup lang="ts">
interface Props {
  ownUsername: string;
  ownAvatarUrl?: string | null;
  targetUsername: string;
  targetAvatarUrl?: string | null;
}

withDefaults(defineProps<Props>(), {
  ownAvatarUrl: null,
  targetAvatarUrl: null,
});
</script>

<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
    <div class="flex items-center gap-3">
      <UAvatar :src="ownAvatarUrl ?? undefined" icon="i-lucide-user" size="lg" />
      <span class="font-semibold text-highlighted"><NumberMotif :text="ownUsername" /></span>
    </div>
    <UIcon name="i-lucide-arrow-left-right" class="size-5 shrink-0 text-muted" />
    <div class="flex items-center gap-3">
      <UAvatar :src="targetAvatarUrl ?? undefined" icon="i-lucide-user" size="lg" />
      <span class="font-semibold text-highlighted"><NumberMotif :text="targetUsername" /></span>
    </div>
  </div>
</template>
