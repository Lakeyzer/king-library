<template>
  <div>
    <CoreAppHeader />

    <UMain>
      <UContainer class="py-8 lg:py-12">
        <slot name="hero" />

        <div
          class="mt-10 flex flex-col gap-8 pb-24 lg:flex-row lg:items-start lg:gap-12"
        >
          <div class="min-w-0 flex-1">
            <slot />
          </div>

          <aside v-if="$slots.aside" class="w-full lg:w-96 lg:shrink-0">
            <slot name="aside" />
          </aside>
        </div>
      </UContainer>
    </UMain>

    <CoreAppFooter />

    <AuthModal />
  </div>
</template>
