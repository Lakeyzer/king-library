<script setup lang="ts">
interface Props {
  text: string | number
}

const props = defineProps<Props>()

const parts = computed(() => splitNumberMotifs(String(props.text)))
</script>

<template>
  <span>
    <template
      v-for="(part, i) in parts"
      :key="i"
    >
      <span
        v-if="part.highlight"
        class="text-warning font-bold"
      >{{
        part.text
      }}</span>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
