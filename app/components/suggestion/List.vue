<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { SuggestionListEntry, SuggestionStatus } from '~/composables/useSuggestions'

interface Props {
  suggestions: SuggestionListEntry[]
  isAdmin: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update-status': [id: string, status: SuggestionStatus]
  'vote': [id: string, isUpvote: boolean, currentVote: boolean | null]
  'deleted': []
}>()

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  new: 'New',
  rejected: 'Rejected',
  confirmed: 'Confirmed',
  applied: 'Applied'
}

const STATUS_COLOR: Record<SuggestionStatus, BadgeProps['color']> = {
  new: 'neutral',
  rejected: 'error',
  confirmed: 'info',
  applied: 'success'
}

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as SuggestionStatus[]).map(value => ({
  label: STATUS_LABEL[value],
  value
}))

// Open/closed state per suggestion, managed here rather than read from
// UCollapsible's own trigger-scoped slot - the chevron toggle now lives
// outside that slot (see template), so it needs an externally readable
// value to reflect against.
const openState = reactive<Record<string, boolean>>({})

// The suggestion currently pending delete confirmation - one shared
// DeleteModal instance for the whole list rather than one per row.
const pendingDelete = ref<SuggestionListEntry | null>(null)
</script>

<template>
  <ul class="space-y-2">
    <li
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      class="rounded-lg border border-default p-3"
    >
      <div class="flex items-center gap-3">
        <!-- Vote buttons, the chevron toggle, and the admin status control
             are true siblings of UCollapsible's trigger, not inside it -
             see design.md "List item structure: UCollapsible per row
             instead of UAccordion's built-in items". Nesting any of them
             inside the trigger's own button would be invalid HTML, and the
             chevron moves out here too so vote buttons can sit to its left
             in the row. -->
        <UCollapsible
          :open="openState[suggestion.id] ?? false"
          class="min-w-0 flex-1"
          @update:open="(value) => (openState[suggestion.id] = value)"
        >
          <template #default>
            <button
              type="button"
              class="flex w-full flex-wrap items-center gap-2 text-left"
            >
              <span class="font-medium">
                <NumberMotif :text="suggestion.title" />
              </span>
              <span class="text-sm text-muted">
                by <NumberMotif :text="suggestion.username ?? 'Anonymous'" />
              </span>
              <UBadge
                :color="STATUS_COLOR[suggestion.status]"
                variant="subtle"
                size="sm"
              >
                {{ STATUS_LABEL[suggestion.status] }}
              </UBadge>
            </button>
          </template>

          <template #content>
            <p class="text-sm whitespace-pre-wrap pt-2">
              <NumberMotif :text="suggestion.body" />
            </p>
          </template>
        </UCollapsible>

        <!-- Voting only accepts mutation while status is "new" (see
             design.md "Voting closes once a suggestion leaves 'new'") -
             buttons stay visible but disabled once triaged, since the
             score/counts are still meaningful, just no longer changeable. -->
        <UTooltip
          text="Voting is closed for this suggestion"
          :disabled="suggestion.status === 'new'"
        >
          <div class="flex items-center gap-2 shrink-0">
            <div class="flex items-center gap-0.5">
              <UButton
                icon="i-lucide-thumbs-up"
                size="xs"
                variant="ghost"
                :color="suggestion.myVote === true ? 'primary' : 'neutral'"
                :disabled="suggestion.status !== 'new'"
                :aria-label="`Upvote &quot;${suggestion.title}&quot;`"
                @click="emit('vote', suggestion.id, true, suggestion.myVote)"
              />
              <span class="text-xs font-medium tabular-nums">{{ suggestion.upvoteCount }}</span>
            </div>
            <div class="flex items-center gap-0.5">
              <UButton
                icon="i-lucide-thumbs-down"
                size="xs"
                variant="ghost"
                :color="suggestion.myVote === false ? 'primary' : 'neutral'"
                :disabled="suggestion.status !== 'new'"
                :aria-label="`Downvote &quot;${suggestion.title}&quot;`"
                @click="emit('vote', suggestion.id, false, suggestion.myVote)"
              />
              <span class="text-xs font-medium tabular-nums">{{ suggestion.downvoteCount }}</span>
            </div>
          </div>
        </UTooltip>

        <UButton
          :icon="openState[suggestion.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          size="xs"
          variant="ghost"
          color="neutral"
          class="shrink-0"
          :aria-label="openState[suggestion.id] ? 'Collapse' : 'Expand'"
          @click="openState[suggestion.id] = !openState[suggestion.id]"
        />

        <USelect
          v-if="isAdmin"
          :model-value="suggestion.status"
          :items="STATUS_OPTIONS"
          size="sm"
          class="w-40 shrink-0"
          @update:model-value="(value) => emit('update-status', suggestion.id, value as SuggestionStatus)"
        />

        <UButton
          v-if="isAdmin"
          icon="i-lucide-trash-2"
          size="xs"
          variant="ghost"
          color="error"
          class="shrink-0"
          :aria-label="`Delete &quot;${suggestion.title}&quot;`"
          @click="pendingDelete = suggestion"
        />
      </div>
    </li>
  </ul>

  <SuggestionDeleteModal
    :suggestion="pendingDelete"
    :open="pendingDelete !== null"
    @update:open="(value) => !value && (pendingDelete = null)"
    @deleted="emit('deleted')"
  />
</template>
