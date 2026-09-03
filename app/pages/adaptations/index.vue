<script setup lang="ts">
import type { Adaptation } from "~/composables/useAdaptations";

definePageMeta({ layout: "default" });

const { fetchAdaptations } = useAdaptations();
const { data: adaptations } = await useAsyncData(
  "adaptations",
  fetchAdaptations,
);
</script>

<template>
  <BibliographyBrowsePage
    title="Adaptations"
    description="Browse film and television adaptations of Stephen King's work."
    :items="adaptations ?? []"
    :year-of="(adaptation: Adaptation) => adaptation.release_year"
    :image-src-of="
      (adaptation: Adaptation) =>
        adaptation.tmdb_poster_path
          ? getTmdbPosterUrl(adaptation.tmdb_poster_path, 'w154')
          : null
    "
    :image-alt-of="(adaptation: Adaptation) => `${adaptation.title} poster`"
    placeholder-icon="i-lucide-film"
    sort-year-label="Release year"
  />
</template>
