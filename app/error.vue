<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

useHead({
  titleTemplate: title => (title ? `${title} • King Library` : 'King Library')
})

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Room Not Found',
  description: 'This page doesn\'t exist - much like the guests at the Overlook.'
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col">
      <CoreAppHeader />

      <UMain class="flex flex-1 items-center">
        <UContainer class="py-16">
          <div
            class="relative mx-auto flex max-w-2xl flex-col items-center gap-6 overflow-hidden rounded-lg border border-default bg-[repeating-linear-gradient(90deg,var(--ui-bg-elevated)_0px,var(--ui-bg-elevated)_28px,var(--ui-bg-muted)_28px,var(--ui-bg-muted)_56px)] px-6 py-16 text-center shadow-lg"
          >
            <div
              class="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-default/90"
              aria-hidden="true"
            />

            <UIcon
              name="i-lucide-door-closed"
              class="relative z-10 size-16 text-highlighted"
              aria-hidden="true"
            />

            <p
              class="relative z-10 text-7xl font-black tracking-widest text-highlighted"
            >
              {{ error.statusCode }}
            </p>

            <div class="relative z-10 flex flex-col gap-2">
              <h1 class="text-2xl font-bold text-highlighted">
                You've wandered into a room that isn't on the floor plan.
              </h1>
              <p class="text-muted">
                {{
                  error.statusMessage
                    || "Whatever you were looking for, it isn't down this hallway."
                }}
              </p>
            </div>

            <UButton
              class="relative z-10"
              label="Back to the lobby"
              icon="i-lucide-log-out"
              size="lg"
              @click="goHome"
            />
          </div>
        </UContainer>
      </UMain>

      <CoreAppFooter />
    </div>
  </UApp>
</template>
