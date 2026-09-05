<script setup lang="ts">
import type { ConnectionListItem } from "~/components/detail/ConnectionList.vue";

definePageMeta({ layout: false });

const route = useRoute();
const slug = route.params.slug as string;

const { fetchKingWorkBySlug } = useKingWorks();
const { data: workData } = await useAsyncData(`work-${slug}`, () =>
  fetchKingWorkBySlug(slug),
);

if (!workData.value) {
  throw createError({ statusCode: 404, statusMessage: "Work not found" });
}

const work = workData.value;
const isCollection = work.type === "collection";

const { fetchAdaptationsForWork } = useAdaptations();
const { fetchShortStoriesForCollection } = useShortStories();
const { fetchWorkStats, fetchUserBooks } = useBooks();

// These three are independent of each other, so kick them all off together
// (useAsyncData starts fetching as soon as it's called) rather than
// sequentially awaiting one at a time - each round trip otherwise stacks
// on top of the last and the page waits for their sum instead of the max.
const [{ data: adaptations }, { data: shortStories }, { data: stats }] = await Promise.all([
  useAsyncData(`work-${slug}-adaptations`, () => fetchAdaptationsForWork(work.id)),
  useAsyncData(`work-${slug}-short-stories`, () =>
    isCollection ? fetchShortStoriesForCollection(work.id) : Promise.resolve([]),
  ),
  useAsyncData(`work-${slug}-stats`, () => fetchWorkStats(work.id)),
]);

// Not awaited: this only affects the reading-status buttons' displayed
// state, which updates reactively once it resolves - no reason to hold up
// the rest of the page for it.
useAsyncData("user-books", fetchUserBooks);

const publishYear = computed(() => Number(work.publish_date.slice(0, 4)));

const coverSrc = computed(() =>
  work.cover_id ? getOpenLibraryCoverUrl(work.cover_id, "L") : null,
);

const adaptationItems = computed<ConnectionListItem[]>(() =>
  (adaptations.value ?? []).map((adaptation) => ({
    id: adaptation.id,
    title: adaptation.title,
    imageSrc: adaptation.tmdb_poster_path
      ? getTmdbPosterUrl(adaptation.tmdb_poster_path, "w154")
      : null,
    imageAlt: `${adaptation.title} poster`,
    year: adaptation.release_year,
    typeLabel: formatTypeLabel(adaptation.type),
    to: `/adaptations/${adaptation.slug}`,
  })),
);

const shortStoryItems = computed<ConnectionListItem[]>(() =>
  (shortStories.value ?? []).map((story) => ({
    id: story.id,
    title: story.title,
    to: `/short-stories/${story.slug}`,
  })),
);

useSeoMeta({ title: work.title });
</script>

<template>
  <NuxtLayout name="detail">
    <template #hero>
      <DetailHero
        :image-src="coverSrc"
        :image-alt="`${work.title} cover`"
        image-placeholder-icon="i-lucide-book"
      >
        <div>
          <h1
            class="text-3xl font-bold text-pretty text-highlighted sm:text-4xl"
          >
            {{ work.title }}
          </h1>
          <div class="flex items-center gap-1.5 text-muted text-xs">
            <span
              >By Stephen King<template v-if="work.co_author">
                &amp; {{ work.co_author }}</template
              ></span
            >
          </div>
          <p class="mt-4 text-muted flex gap-4 items-center">
            {{ publishYear }}
            <span>{{ formatTypeLabel(work.type) }}</span>
          </p>
        </div>

        <div
          v-if="work.dark_tower || work.bachman"
          class="flex flex-wrap items-center gap-2"
        >
          <UBadge
            v-if="work.dark_tower"
            color="primary"
            variant="subtle"
            icon="i-lucide-tornado"
            label="Dark Tower"
          />
          <UBadge
            v-if="work.bachman"
            color="neutral"
            variant="subtle"
            icon="i-lucide-user-round"
            label="Bachman"
          />
        </div>

        <p v-if="work.description" class="whitespace-pre-line">
          {{ work.description }}
        </p>

        <template v-if="shortStoryItems.length" #related>
          <DetailConnectionList heading="Contains" :items="shortStoryItems" />
        </template>

        <template #actions>
          <BookReadingActions :work-id="work.id" mode="expanded" />
        </template>

        <template v-if="stats" #stats>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-book-open" class="size-4" />
            <span
              ><strong class="text-highlighted">{{
                stats.currently_reading_count
              }}</strong>
              reading</span
            >
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-bookmark" class="size-4" />
            <span
              ><strong class="text-highlighted">{{
                stats.want_to_read_count
              }}</strong>
              want to read</span
            >
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-circle-check" class="size-4" />
            <span
              ><strong class="text-highlighted">{{ stats.read_count }}</strong>
              read</span
            >
          </div>
        </template>
      </DetailHero>
    </template>

    <div class="flex flex-col gap-8">
      <WorkEditionList
        v-if="work.open_library_work_key"
        :work-key="work.open_library_work_key"
      />

      <DetailConnectionList
        heading="Adaptations"
        :items="adaptationItems"
        placeholder-icon="i-lucide-film"
        orientation="horizontal"
      />
    </div>
  </NuxtLayout>
</template>
