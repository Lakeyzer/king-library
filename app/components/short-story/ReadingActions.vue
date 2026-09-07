<script setup lang="ts">
interface Props {
  shortStoryId: string;
}

const props = defineProps<Props>();

const user = useSupabaseUser();
const { readShortStoryIds, toggleRead } = useShortStories();

const isRead = computed(() => readShortStoryIds.value[props.shortStoryId] ?? false);
const label = computed(() => (isRead.value ? "Mark as Unread" : "Mark as Read"));
</script>

<template>
  <IconLabelButton
    v-if="user"
    :label="label"
    icon="i-lucide-circle-check"
    :filled="isRead"
    @click="toggleRead(shortStoryId)"
  />
</template>
