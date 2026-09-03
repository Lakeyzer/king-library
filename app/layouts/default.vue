<template>
  <div>
    <CoreAppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <slot />
        </UPage>
      </UContainer>
    </UMain>

    <CoreAppFooter />
  </div>
</template>
