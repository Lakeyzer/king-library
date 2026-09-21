<template>
  <UFooter>
    <template #left>
      <p class="text-xs text-muted">
        King Library is an unofficial, fan-made project. It is not affiliated
        with, endorsed by, or sponsored by Stephen King or his
        representatives.
      </p>
    </template>

    <template #right>
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/suggestion-box"
          class="flex items-center gap-1 text-xs text-muted hover:text-default"
        >
          <UIcon
            name="i-lucide-mailbox"
            class="size-3.5"
          />
          Suggestion Box
        </NuxtLink>
        <NuxtLink
          to="/privacy-policy"
          class="text-xs text-muted hover:text-default"
        >
          Privacy Policy
        </NuxtLink>
      </div>
    </template>
  </UFooter>
</template>
