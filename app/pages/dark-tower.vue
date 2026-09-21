<script setup lang="ts">
import type { KingWork } from "~/composables/useKingWorks";

definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Dark Tower",
  description:
    "The eight core Dark Tower novels in reading order, plus the wider constellation of King works connected to Roland's quest.",
});

const { fetchKingWorks } = useKingWorks();
const { fetchAllSeries } = useSeries();

const user = useSupabaseUser();

const {
  fetchUserBooks,
  fetchProfileBookStats,
  fetchDarkTowerRelatedProgress,
  fetchDarkTowerJourneyStats,
  fetchNextDarkTowerBook,
  fetchNextDarkTowerRelatedBook,
} = useBooks();

// Not awaited: only affects the reading-status/edition buttons' displayed
// state, which updates reactively once it resolves - same as the works and
// adaptations pages. Required whenever BookReadingActions/WorkTile render,
// per nuxt-conventions "BookReadingActions... need their page to pre-fetch
// status".
useAsyncData("user-books", fetchUserBooks);

const [{ data: works }, { data: series }] = await Promise.all([
  useAsyncData("dark-tower-works", fetchKingWorks),
  useAsyncData("dark-tower-series", fetchAllSeries),
]);

const darkTowerSeries = computed(
  () => (series.value ?? []).find((one) => one.name === "Dark Tower") ?? null,
);

// Ordered by canonical series position (not publish date) - see design.md
// "Order the core 8 by series position, not publish date": this is what
// correctly places The Wind Through the Keyhole 5th rather than 8th.
const coreWorks = computed<KingWork[]>(() => {
  const positionByWorkId = new Map(
    (darkTowerSeries.value?.members ?? []).map((member) => [
      member.workId,
      member.position,
    ]),
  );
  return (works.value ?? [])
    .filter((work) => positionByWorkId.has(work.id))
    .sort((a, b) => positionByWorkId.get(a.id)! - positionByWorkId.get(b.id)!);
});

// Every active King work with a Dark Tower relation note is, by
// construction, not one of the core 8 (see king-works spec's "Seed data
// includes Dark Tower relation notes for connected works" - the core 8
// have no relation note), so no separate exclusion is needed here.
const relatedWorks = computed<KingWork[]>(() =>
  (works.value ?? [])
    .filter((work) => work.dark_tower_relation !== null)
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date)),
);

// Site-wide, not personal - visible to signed-out visitors too, unlike the
// rest of the sidebar below.
const { data: journeyStats } = useAsyncData(
  "dark-tower-journey-stats",
  fetchDarkTowerJourneyStats,
);

// Sidebar content is signed-in only (per dark-tower-page spec's four
// "Signed-in visitor sees/is suggested..." requirements) - each fetch
// resolves to null/empty for a signed-out visitor rather than running.
const [
  { data: darkTowerProgress },
  { data: relatedProgress },
  { data: nextCoreBook },
  { data: nextRelatedBook },
] = await Promise.all([
  useAsyncData("dark-tower-progress", () =>
    user.value
      ? fetchProfileBookStats(user.value.sub).then((stats) => stats.darkTower)
      : Promise.resolve(null),
  ),
  useAsyncData("dark-tower-related-progress", () =>
    user.value
      ? fetchDarkTowerRelatedProgress(user.value.sub)
      : Promise.resolve(null),
  ),
  useAsyncData("dark-tower-next-book", () =>
    user.value ? fetchNextDarkTowerBook(user.value.sub) : Promise.resolve(null),
  ),
  useAsyncData("dark-tower-next-related-book", () =>
    user.value
      ? fetchNextDarkTowerRelatedBook(user.value.sub)
      : Promise.resolve(null),
  ),
]);
</script>

<template>
  <div class="py-4">
    <div class="flex gap-2 justify-baseline items-center">
      <UIcon name="i-lucide-rose" class="text-primary size-6" />
      <h1 class="text-2xl font-bold grow">Dark Tower</h1>
    </div>
    <p class="text-muted italic">
      The eight core novels in reading order, and the works connected to
      Roland's quest.
    </p>

    <UPageBody>
      <section class="mb-8">
        <DarkTowerCoreList :works="coreWorks" />
      </section>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div class="min-w-0 flex-1">
          <section>
            <h2 class="mb-3 text-lg font-semibold text-highlighted">
              Dark Tower Related Works
            </h2>
            <DarkTowerRelatedList :works="relatedWorks" />
          </section>
        </div>

        <div class="flex w-full flex-col gap-6 lg:w-96 lg:shrink-0">
          <DarkTowerJourneyStats :stats="journeyStats ?? null" />

          <template v-if="user">
            <ProfileProgressBar
              v-if="darkTowerProgress"
              label="Dark Tower"
              icon="i-lucide-rose"
              :count="darkTowerProgress.count"
              :total="darkTowerProgress.total"
              color="success"
            />
            <ProfileProgressBar
              v-if="relatedProgress"
              label="Dark Tower Related"
              icon="i-lucide-link"
              :count="relatedProgress.count"
              :total="relatedProgress.total"
              color="info"
            />
            <DarkTowerSuggestionCard
              heading="Read Next in the Series"
              icon="i-lucide-book-open"
              :work="nextCoreBook ?? null"
            />
            <DarkTowerSuggestionCard
              heading="Read Next: Related"
              icon="i-lucide-link"
              :work="nextRelatedBook ?? null"
            />
          </template>
        </div>
      </div>
    </UPageBody>
  </div>
</template>
