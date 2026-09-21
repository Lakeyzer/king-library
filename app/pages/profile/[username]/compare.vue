<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const username = route.params.username as string;

const { profile: ownProfile, fetchProfileByUsername } = useProfile();
const { data: targetProfile } = await useAsyncData(`compare-target-${username}`, () =>
  fetchProfileByUsername(username),
);

if (!targetProfile.value) {
  throw createError({ statusCode: 404, statusMessage: "Profile not found" });
}

// Already loaded by the onboarding middleware before this route renders
// (compare routes require sign-in, same as /profile's own-shortcut routes)
// - no fetch needed here, mirroring pages/profile/index.vue.
const own = ownProfile.value!;
const target = targetProfile.value;

const isSelfCompare = target.id === own.id;
const isPrivate = !isSelfCompare && !target.is_public;
const canCompare = !isSelfCompare && !isPrivate;

const { fetchProfileBookStats, fetchReadDiff, fetchOwnedDiff } = useBooks();
const { fetchViewingProgress, fetchWatchedDiff } = useAdaptations();

const [
  { data: ownStats },
  { data: targetStats },
  { data: ownViewing },
  { data: targetViewing },
  { data: readDiff },
  { data: ownedDiff },
  { data: watchedDiff },
] = await Promise.all([
  useAsyncData(`compare-${own.id}-${target.id}-own-book-stats`, () =>
    canCompare ? fetchProfileBookStats(own.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-target-book-stats`, () =>
    canCompare ? fetchProfileBookStats(target.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-own-viewing`, () =>
    canCompare ? fetchViewingProgress(own.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-target-viewing`, () =>
    canCompare ? fetchViewingProgress(target.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-read-diff`, () =>
    canCompare ? fetchReadDiff(own.id, target.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-owned-diff`, () =>
    canCompare ? fetchOwnedDiff(own.id, target.id) : Promise.resolve(null),
  ),
  useAsyncData(`compare-${own.id}-${target.id}-watched-diff`, () =>
    canCompare ? fetchWatchedDiff(own.id, target.id) : Promise.resolve(null),
  ),
]);

// The three sources that can feed the "Total Activity" bar - each toggled
// independently via the select next to its title, so a visitor can narrow
// the always-full bar down to just the category they care about.
const ACTIVITY_CATEGORIES = [
  { label: "Books Read", value: "read" },
  { label: "Books Collected", value: "owned" },
  { label: "Adaptations Watched", value: "watched" },
] as const;
type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]["value"];

const selectedActivityCategories = ref<ActivityCategory[]>(["read", "owned", "watched"]);

const ownTotalActivity = computed(() => {
  if (!ownStats.value || !ownViewing.value) return 0;
  let total = 0;
  if (selectedActivityCategories.value.includes("read")) total += ownStats.value.overall.count;
  if (selectedActivityCategories.value.includes("owned")) total += ownStats.value.collection.count;
  if (selectedActivityCategories.value.includes("watched")) total += ownViewing.value.count;
  return total;
});
const targetTotalActivity = computed(() => {
  if (!targetStats.value || !targetViewing.value) return 0;
  let total = 0;
  if (selectedActivityCategories.value.includes("read")) total += targetStats.value.overall.count;
  if (selectedActivityCategories.value.includes("owned")) total += targetStats.value.collection.count;
  if (selectedActivityCategories.value.includes("watched")) total += targetViewing.value.count;
  return total;
});

const { setPageSeo } = useSeo();
setPageSeo({
  title: `${own.username} vs ${target.username}`,
  description: `Compare ${own.username}'s and ${target.username}'s Stephen King reading and viewing progress.`,
});
useSeoMeta({ title: `${own.username} vs ${target.username} - Compare` });
</script>

<template>
  <div class="py-8 flex flex-col gap-8">
    <ProfileCompareHeader
      :own-username="own.username ?? ''"
      :own-avatar-url="own.avatar_url"
      :target-username="target.username ?? ''"
      :target-avatar-url="target.avatar_url"
    />

    <UEmpty
      v-if="isSelfCompare"
      icon="i-lucide-users"
      title="Can't compare a profile with itself"
      description="Pick a different profile to compare against."
    />
    <UEmpty
      v-else-if="isPrivate"
      icon="i-lucide-eye-off"
      title="This profile is private"
      description="The owner of this profile has chosen to keep it private."
    />
    <template v-else-if="ownStats && targetStats && ownViewing && targetViewing && readDiff && ownedDiff && watchedDiff">
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="flex items-center gap-2 text-base font-semibold text-highlighted">
            <UIcon name="i-lucide-scale" class="size-5" />
            <span>Total Activity</span>
          </h2>
          <USelectMenu
            v-model="selectedActivityCategories"
            :items="ACTIVITY_CATEGORIES"
            value-key="value"
            multiple
            :search-input="false"
            :ui="{ content: 'min-w-fit' }"
            class="w-44"
          >
            <template #default>
              {{ selectedActivityCategories.length }} of {{ ACTIVITY_CATEGORIES.length }} selected
            </template>
          </USelectMenu>
        </div>

        <div class="flex flex-col gap-2 rounded-lg bg-elevated p-4">
          <UProgressGroup
            :items="[
              { value: ownTotalActivity, color: 'primary' },
              { value: targetTotalActivity, color: 'warning' },
            ]"
            :max="ownTotalActivity + targetTotalActivity"
            size="lg"
          />

          <div class="flex items-center justify-between gap-2 text-xs font-medium text-muted">
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-primary" />
              <NumberMotif :text="own.username ?? ''" />
            </span>
            <span class="flex items-center gap-1.5">
              <NumberMotif :text="target.username ?? ''" />
              <span class="size-2 rounded-full bg-warning" />
            </span>
          </div>

          <div class="flex items-center justify-between text-xs font-semibold tabular-nums text-highlighted">
            <NumberMotif :text="`${ownTotalActivity}`" />
            <NumberMotif :text="`${targetTotalActivity}`" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h2 class="flex items-center gap-2 text-base font-semibold text-highlighted">
          <UIcon name="i-lucide-book-open-check" class="size-5" />
          <span>Reading Progress</span>
        </h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProfileCompareProgressCard
            title="Overall Bibliography"
            icon="i-lucide-book-open"
            class="md:col-span-2"
            :own-label="own.username ?? ''"
            :own-count="ownStats.overall.count"
            :own-total="ownStats.overall.total"
            :target-label="target.username ?? ''"
            :target-count="targetStats.overall.count"
            :target-total="targetStats.overall.total"
          />
          <ProfileCompareProgressCard
            title="Bachman Books"
            icon="i-lucide-user-round"
            :own-label="own.username ?? ''"
            :own-count="ownStats.bachman.count"
            :own-total="ownStats.bachman.total"
            :target-label="target.username ?? ''"
            :target-count="targetStats.bachman.count"
            :target-total="targetStats.bachman.total"
          />
          <ProfileCompareProgressCard
            title="Dark Tower"
            icon="i-lucide-rose"
            :own-label="own.username ?? ''"
            :own-count="ownStats.darkTower.count"
            :own-total="ownStats.darkTower.total"
            :target-label="target.username ?? ''"
            :target-count="targetStats.darkTower.count"
            :target-total="targetStats.darkTower.total"
          />
          <ProfileCompareProgressCard
            title="Collection"
            icon="i-lucide-library"
            :own-label="own.username ?? ''"
            :own-count="ownStats.collection.count"
            :own-total="ownStats.collection.total"
            :target-label="target.username ?? ''"
            :target-count="targetStats.collection.count"
            :target-total="targetStats.collection.total"
          />
          <ProfileCompareProgressCard
            title="Adaptations Watched"
            icon="i-lucide-film"
            :own-label="own.username ?? ''"
            :own-count="ownViewing.count"
            :own-total="ownViewing.total"
            :target-label="target.username ?? ''"
            :target-count="targetViewing.count"
            :target-total="targetViewing.total"
          />
        </div>
      </div>

      <ProfileCompareRow title="Books Read" icon="i-lucide-book-open-check">
        <template #left>
          <ProfileCompareDiffCard
            :title="`By ${own.username}`"
            icon="i-lucide-book-open-check"
            :description="`${readDiff.onlyA.length} read books ${target.username} hasn't.`"
          >
            <ProfileCompareWorkList
              :items="readDiff.onlyA"
              :empty-description="`Nothing ${own.username} has read that ${target.username} hasn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
        <template #right>
          <ProfileCompareDiffCard
            :title="`By ${target.username}`"
            icon="i-lucide-book-open-check"
            :description="`${readDiff.onlyB.length} read books ${own.username} hasn't.`"
          >
            <ProfileCompareWorkList
              :items="readDiff.onlyB"
              :empty-description="`Nothing ${target.username} has read that ${own.username} hasn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
      </ProfileCompareRow>

      <ProfileCompareRow title="Books Owned" icon="i-lucide-library">
        <template #left>
          <ProfileCompareDiffCard
            :title="`By ${own.username}`"
            icon="i-lucide-library"
            :description="`${ownedDiff.onlyA.length} owned books ${target.username} doesn't.`"
          >
            <ProfileCompareWorkList
              :items="ownedDiff.onlyA"
              :empty-description="`Nothing ${own.username} owns that ${target.username} doesn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
        <template #right>
          <ProfileCompareDiffCard
            :title="`By ${target.username}`"
            icon="i-lucide-library"
            :description="`${ownedDiff.onlyB.length} owned books ${own.username} doesn't.`"
          >
            <ProfileCompareWorkList
              :items="ownedDiff.onlyB"
              :empty-description="`Nothing ${target.username} owns that ${own.username} doesn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
      </ProfileCompareRow>

      <ProfileCompareRow title="Adaptations Watched" icon="i-lucide-clapperboard">
        <template #left>
          <ProfileCompareDiffCard
            :title="`By ${own.username}`"
            icon="i-lucide-clapperboard"
            :description="`${watchedDiff.onlyA.length} watched adaptations ${target.username} hasn't.`"
          >
            <ProfileCompareAdaptationList
              :items="watchedDiff.onlyA"
              :empty-description="`Nothing ${own.username} has watched that ${target.username} hasn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
        <template #right>
          <ProfileCompareDiffCard
            :title="`By ${target.username}`"
            icon="i-lucide-clapperboard"
            :description="`${watchedDiff.onlyB.length} watched adaptations ${own.username} hasn't.`"
          >
            <ProfileCompareAdaptationList
              :items="watchedDiff.onlyB"
              :empty-description="`Nothing ${target.username} has watched that ${own.username} hasn't.`"
            />
          </ProfileCompareDiffCard>
        </template>
      </ProfileCompareRow>
    </template>
  </div>
</template>
