<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface Props {
  shortStoryId: string;
  mode?: "compact" | "expanded";
}

const props = withDefaults(defineProps<Props>(), {
  mode: "compact",
});

const user = useSupabaseUser();
const { readShortStoryIds, toggleRead } = useShortStories();

const isRead = computed(() => readShortStoryIds.value[props.shortStoryId] ?? false);
const label = computed(() => (isRead.value ? "Mark as Unread" : "Mark as Read"));

function handleToggle() {
  toggleRead(props.shortStoryId);
}

// Short stories only ever have this one action - unlike BookReadingActions/
// AdaptationWatchActions, compact mode's dropdown always has exactly one
// item, but it still uses the same status-icon + ellipsis-menu shape for
// visual consistency with those.
const dropdownItems = computed<DropdownMenuItem[]>(() => [
  {
    label: label.value,
    icon: "i-lucide-circle-check",
    onSelect: handleToggle,
  },
]);
</script>

<template>
  <template v-if="user">
    <div v-if="mode === 'compact'" class="flex items-center gap-1">
      <UTooltip v-if="isRead" text="Read">
        <UIcon name="i-lucide-circle-check" class="size-5 text-muted" />
      </UTooltip>

      <UDropdownMenu :items="dropdownItems" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="subtle"
          aria-label="Reading actions"
        />
      </UDropdownMenu>
    </div>

    <IconLabelButton
      v-else
      :label="label"
      icon="i-lucide-circle-check"
      :filled="isRead"
      @click="handleToggle"
    />
  </template>
</template>
