<script setup lang="ts">
const { fetchKingWorks } = useKingWorks()
const { data: works } = await useAsyncData("king-works-test", fetchKingWorks)
</script>

<template>
  <div>
    <p v-for="work in works" :key="work.id">
      {{ work.title }} — {{ work.original_publish_year }}
    </p>
  </div>
</template>
