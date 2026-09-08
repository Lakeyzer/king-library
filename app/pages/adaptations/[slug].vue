<script setup lang="ts">
import type { ConnectionListItem } from "~/components/detail/ConnectionList.vue";

definePageMeta({ layout: false });

const route = useRoute();
const slug = route.params.slug as string;

const { fetchAdaptationBySlug } = useAdaptations();
const { data: adaptationData } = await useAsyncData(`adaptation-${slug}`, () =>
  fetchAdaptationBySlug(slug),
);

if (!adaptationData.value) {
  throw createError({ statusCode: 404, statusMessage: "Adaptation not found" });
}

const adaptation = adaptationData.value;

const { fetchTmdbDetails } = useTmdb();
const { fetchAdaptationStats, fetchUserAdaptations } = useAdaptations();

// tmdb (a live third-party call, the slowest of the two by far) and stats
// (our own DB) are independent - run them together instead of sequentially.
const [{ data: tmdb }, { data: stats }] = await Promise.all([
  useAsyncData(`adaptation-${slug}-tmdb`, () =>
    adaptation.tmdb_id && adaptation.tmdb_media_type
      ? fetchTmdbDetails(adaptation.tmdb_media_type, adaptation.tmdb_id)
      : Promise.resolve(null),
  ),
  useAsyncData(`adaptation-${slug}-stats`, () => fetchAdaptationStats(adaptation.id)),
]);

// Not awaited: only affects the watch-status buttons' displayed state,
// which updates reactively once it resolves.
useAsyncData("user-adaptations", fetchUserAdaptations);

const posterSrc = computed(() =>
  adaptation.tmdb_poster_path
    ? getTmdbPosterUrl(adaptation.tmdb_poster_path, "w342")
    : null,
);

const runtimeOrSeasonLabel = computed(() => {
  if (!tmdb.value) return null;

  if (adaptation.tmdb_media_type === "movie" && tmdb.value.runtimeMinutes) {
    const hours = Math.floor(tmdb.value.runtimeMinutes / 60);
    const minutes = tmdb.value.runtimeMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (adaptation.tmdb_media_type === "tv" && tmdb.value.numberOfSeasons) {
    return tmdb.value.numberOfSeasons > 1
      ? `${tmdb.value.numberOfSeasons} Seasons`
      : `${tmdb.value.numberOfEpisodes ?? 0} Episodes`;
  }

  return null;
});

const directedByLabel = computed(() =>
  adaptation.tmdb_media_type === "tv" ? "Created by" : "Directed by",
);

const basedOnWorkItems = computed<ConnectionListItem[]>(() =>
  adaptation.basedOnWorks.map((work) => ({
    id: work.id,
    title: work.title,
    imageSrc: work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, "M") : null,
    imageAlt: `${work.title} cover`,
    year: Number(work.publish_date.slice(0, 4)),
    typeLabel: formatTypeLabel(work.type),
    to: `/works/${work.slug}`,
  })),
);

const basedOnShortStoryItems = computed<ConnectionListItem[]>(() =>
  adaptation.basedOnShortStories.map((story) => ({
    id: story.id,
    title: story.title,
    typeLabel: story.collections.length
      ? `from ${story.collections.map((collection) => collection.title).join(", ")}`
      : undefined,
    to: `/short-stories/${story.slug}`,
  })),
);

useSeoMeta({ title: adaptation.title });
</script>

<template>
  <NuxtLayout name="detail">
    <template #hero>
      <DetailHero
        :image-src="posterSrc"
        :image-alt="`${adaptation.title} poster`"
        image-placeholder-icon="i-lucide-film"
      >
        <div>
          <h1
            class="text-3xl font-bold text-pretty text-highlighted sm:text-4xl"
          >
            {{ adaptation.title }}
          </h1>
          <div
            v-if="tmdb?.directedBy.length"
            class="flex items-center gap-1.5 text-muted text-xs"
          >
            <span
              >{{ directedByLabel }} {{ tmdb.directedBy.join(", ") }}</span
            >
          </div>
          <p class="mt-4 text-muted flex gap-4 items-center">
            {{ adaptation.release_year }}
            <span>{{ formatTypeLabel(adaptation.type) }}</span>
            <span v-if="runtimeOrSeasonLabel">
              {{ runtimeOrSeasonLabel }}
            </span>
          </p>
        </div>

        <div v-if="tmdb?.genres.length" class="flex flex-wrap gap-2">
          <UBadge
            v-for="genre in tmdb.genres"
            :key="genre"
            color="neutral"
            variant="subtle"
            :label="genre"
            size="sm"
          />
        </div>

        <div class="flex flex-wrap items-center gap-4 text-sm">
          <div v-if="tmdb?.rating" class="flex items-center gap-1.5">
            <UIcon
              name="i-simple-icons-themoviedatabase"
              class="size-4 text-[#01b4e4]"
            />
            <span class="font-medium text-highlighted">
              {{ tmdb.rating.toFixed(1) }}
            </span>
            <span class="text-muted">/ 10</span>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <p v-if="tmdb?.overview" class="whitespace-pre-line">
            {{ tmdb.overview }}
          </p>
          <p
            v-if="adaptation.notes"
            class="whitespace-pre-line text-sm text-muted italic"
          >
            {{ adaptation.notes }}
          </p>
          <UAlert
            v-if="adaptation.is_universe_only"
            color="neutral"
            variant="subtle"
            icon="i-lucide-sparkles"
            description="Loosely set in Stephen King's universe rather than adapting a specific work."
          />
        </div>

        <template v-if="basedOnShortStoryItems.length" #related>
          <DetailConnectionList
            heading="Based on"
            :items="basedOnShortStoryItems"
          />
        </template>

        <template #actions>
          <AdaptationWatchActions :adaptation-id="adaptation.id" />
        </template>

        <template v-if="stats" #stats>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-bookmark" class="size-4" />
            <span
              ><strong class="text-highlighted">{{
                stats.want_to_watch_count
              }}</strong>
              want to watch</span
            >
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-circle-check" class="size-4" />
            <span
              ><strong class="text-highlighted">{{
                stats.watched_count
              }}</strong>
              watched</span
            >
          </div>
        </template>
      </DetailHero>
    </template>

    <DetailConnectionList
      heading="Based on"
      :items="basedOnWorkItems"
      placeholder-icon="i-lucide-book"
      orientation="horizontal"
    />
  </NuxtLayout>
</template>
