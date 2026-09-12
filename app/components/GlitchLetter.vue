<script setup lang="ts">
interface Props {
  text: string
  letter: string
  /** When false, renders the text unchanged - lets call sites stay unconditional. */
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), { active: true })

const parts = computed(() =>
  props.active
    ? splitGlitchLetter(props.text, props.letter)
    : [{ text: props.text, glitch: false }]
)
</script>

<template>
  <span>
    <template
      v-for="(part, i) in parts"
      :key="i"
    >
      <span
        v-if="part.glitch"
        class="opacity-40"
      >{{ part.text }}</span>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
