<script setup lang="ts">
import type { AccordionItem, BadgeProps } from '@nuxt/ui'
import type { ReportContentArea, ReportListEntry, ReportStatus, ReportType } from '~/composables/useReports'

interface Props {
  reports: ReportListEntry[]
  isAdmin: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-status': [id: string, status: ReportStatus]
  'deleted': []
}>()

const TYPE_LABEL: Record<ReportType, string> = {
  issue: 'Issue',
  missing_content: 'Missing Content'
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  new: 'New',
  rejected: 'Rejected',
  applied: 'Applied'
}

const STATUS_COLOR: Record<ReportStatus, BadgeProps['color']> = {
  new: 'neutral',
  rejected: 'error',
  applied: 'success'
}

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ReportStatus[]).map(value => ({
  label: STATUS_LABEL[value],
  value
}))

// Mirrors detailPathPrefix on the four BibliographyBrowsePage instances -
// used to link an issue report to the item it's about.
const CONTENT_AREA_PATH_PREFIX: Record<ReportContentArea, string> = {
  works: '/works',
  short_works: '/short-works',
  adaptations: '/adaptations',
  works_by_others: '/works-by-others',
  // Never used for a link in practice - dark_tower reports are
  // missing-content only, so they never carry an itemSlug.
  dark_tower: '/dark-tower'
}

interface ReportAccordionItem extends AccordionItem {
  report: ReportListEntry
}

const items = computed<ReportAccordionItem[]>(() =>
  props.reports.map(report => ({
    value: report.id,
    report
  }))
)

function itemPath(report: ReportListEntry): string | null {
  if (!report.itemSlug) return null
  return `${CONTENT_AREA_PATH_PREFIX[report.contentArea]}/${report.itemSlug}`
}

// The report currently pending delete confirmation - one shared
// DeleteModal instance for the whole list rather than one per row, same as
// SuggestionList's pendingDelete.
const pendingDelete = ref<ReportListEntry | null>(null)

// See SuggestionList's identical `ui`/click.stop notes - same
// grow-the-trigger-label and stop-propagation-on-inner-controls reasons.
const ui = { label: 'flex-1 min-w-0' }
</script>

<template>
  <UAccordion
    :items="items"
    :ui="ui"
  >
    <template #default="{ item }">
      <div class="flex w-full min-w-0 flex-wrap items-center gap-2">
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ TYPE_LABEL[item.report.type] }}
        </UBadge>
        <span class="text-sm text-muted">
          {{ formatTypeLabel(item.report.contentArea) }}
        </span>
        <NuxtLink
          v-if="itemPath(item.report)"
          :to="itemPath(item.report)!"
          class="text-sm font-medium text-primary hover:underline"
          @click.stop
        >
          <NumberMotif :text="item.report.itemTitle!" />
        </NuxtLink>
        <UBadge
          :color="STATUS_COLOR[item.report.status]"
          variant="subtle"
          size="sm"
        >
          {{ STATUS_LABEL[item.report.status] }}
        </UBadge>

        <div
          v-if="isAdmin"
          class="ml-auto flex items-center gap-2"
          @click.stop
        >
          <USelect
            as="div"
            tabindex="0"
            :model-value="item.report.status"
            :items="STATUS_OPTIONS"
            size="sm"
            class="w-32"
            @update:model-value="(value) => emit('update-status', item.report.id, value as ReportStatus)"
          />

          <UButton
            as="div"
            role="button"
            tabindex="0"
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            aria-label="Delete report"
            @click="pendingDelete = item.report"
          />
        </div>
      </div>
    </template>

    <template #body="{ item }">
      <p class="text-sm whitespace-pre-wrap">
        <NumberMotif :text="item.report.description" />
      </p>
    </template>
  </UAccordion>

  <ReportDeleteModal
    :report="pendingDelete"
    :open="pendingDelete !== null"
    @update:open="(value) => !value && (pendingDelete = null)"
    @deleted="emit('deleted')"
  />
</template>
