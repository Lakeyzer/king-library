<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <UPageHero
      title="King Library"
      description="Build your own Stephen King bookshelf and track your reading progress — collect, wishlist, and check off books, short stories, and adaptations as you go."
    />

    <UPageCTA
      title="Works"
      description="Browse the canonical Stephen King bibliography and add books to your collection."
      :links="[{
        label: 'Browse works',
        to: '/works',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    />

    <UPageCTA
      title="Short Stories"
      description="Explore Stephen King's short stories and novellas and track which ones you've read."
      :links="[{
        label: 'Browse short stories',
        to: '/short-stories',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    />

    <UPageCTA
      title="Adaptations"
      description="Discover film and television adaptations of Stephen King's work and keep tabs on what you've watched."
      :links="[{
        label: 'Browse adaptations',
        to: '/adaptations',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    />
  </div>
</template>
