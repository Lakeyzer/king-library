<script setup lang="ts">
import type { WorkLeaderboardEntry } from "~/composables/useBooks";

interface Props {
  work: WorkLeaderboardEntry | null;
}

defineProps<Props>();

const user = useSupabaseUser();
const { open: openAuthModal } = useAuthModal();
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-elevated p-4">
    <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-eye-off" class="size-4" />
      Give This One a Chance
    </h2>

    <UEmpty
      v-if="!work"
      description="No released King work is eligible right now."
    />

    <template v-else>
      <WorkTile :work="work" />
    </template>
  </div>
</template>
