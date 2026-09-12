<script setup lang="ts">
interface Props {
  text: string
}

const props = defineProps<Props>()

const displayText = ref(props.text)

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const FRAME_DURATION_MS = 30

let intervalId: ReturnType<typeof setInterval> | null = null

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
}

function stopAnimation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function animateTo(target: string) {
  stopAnimation()

  const from = displayText.value
  const length = Math.max(from.length, target.length)
  const starts: number[] = []
  const ends: number[] = []
  let maxEnd = 0

  for (let i = 0; i < length; i++) {
    const start = Math.floor(Math.random() * 15)
    const end = start + 10 + Math.floor(Math.random() * 15)
    starts.push(start)
    ends.push(end)
    maxEnd = Math.max(maxEnd, end)
  }

  let frame = 0

  intervalId = setInterval(() => {
    let output = ''

    for (let i = 0; i < length; i++) {
      if (frame >= ends[i]!) {
        output += target[i] ?? ''
      } else if (frame >= starts[i]!) {
        output += randomChar()
      } else {
        output += from[i] ?? ''
      }
    }

    displayText.value = output
    frame++

    if (frame > maxEnd) {
      displayText.value = target
      stopAnimation()
    }
  }, FRAME_DURATION_MS)
}

watch(
  () => props.text,
  newText => animateTo(newText)
)

onUnmounted(stopAnimation)
</script>

<template>
  <span>{{ displayText }}</span>
</template>
