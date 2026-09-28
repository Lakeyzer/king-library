<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import { SUGGESTION_STATUS_COLOR, SUGGESTION_STATUS_LABEL } from '~/composables/useSuggestions'
import type { SuggestionListEntry, SuggestionStatus } from '~/composables/useSuggestions'

interface Props {
  suggestions: SuggestionListEntry[]
  isAdmin: boolean
  // Id of the suggestion whose admin response is currently being saved.
  savingCommentId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  savingCommentId: null
})

const emit = defineEmits<{
  'update-status': [id: string, status: SuggestionStatus]
  'vote': [id: string, isUpvote: boolean, currentVote: boolean | null]
  'update-comment': [id: string, comment: string | null]
  'deleted': []
}>()

const STATUS_OPTIONS = (Object.keys(SUGGESTION_STATUS_LABEL) as SuggestionStatus[]).map(value => ({
  label: SUGGESTION_STATUS_LABEL[value],
  value
}))

interface SuggestionAccordionItem extends AccordionItem {
  suggestion: SuggestionListEntry
}

const items = computed<SuggestionAccordionItem[]>(() =>
  props.suggestions.map(suggestion => ({
    value: suggestion.id,
    suggestion
  }))
)

// The suggestion currently pending delete confirmation - one shared
// DeleteModal instance for the whole list rather than one per row.
const pendingDelete = ref<SuggestionListEntry | null>(null)

// The default theme's "label" slot (wrapping our #default content) has no
// grow class of its own, so it only sizes to its content - leaving the
// trailing chevron sitting right after the badge instead of at the row's
// end. Growing it here lets our own flex row fill the trigger, pushing the
// actions all the way to the end, before the chevron.
const ui = { label: 'flex-1 min-w-0' }
</script>

<template>
  <UAccordion
    :items="items"
    :ui="ui"
  >
    <template #default="{ item }">
      <div class="flex w-full min-w-0 flex-wrap items-center gap-2">
        <span class="font-medium">
          <NumberMotif :text="item.suggestion.title" />
        </span>
        <span class="text-sm text-muted">
          by <NumberMotif :text="item.suggestion.username ?? 'Anonymous'" />
        </span>
        <UBadge
          :color="SUGGESTION_STATUS_COLOR[item.suggestion.status]"
          variant="subtle"
          size="sm"
        >
          {{ SUGGESTION_STATUS_LABEL[item.suggestion.status] }}
        </UBadge>
        <!-- Not a control, so it can sit outside the @click.stop cluster
             below - UTooltip renders its trigger as the icon itself (no
             extra button), so nothing new is nested in the accordion's
             trigger button. -->
        <UTooltip
          v-if="item.suggestion.adminComment"
          text="Has an admin response"
        >
          <UIcon
            name="i-lucide-message-square"
            class="text-primary size-4"
            aria-label="Has an admin response"
          />
        </UTooltip>

        <!--
          This whole cluster ends up nested inside AccordionTrigger's own
          <button> here, since UAccordion always renders its trigger as a
          button with no way to opt out via its public API. @click.stop
          keeps a click on any control below from also bubbling up and
          toggling the accordion - the USelect/UButton popups they open are
          teleported elsewhere in the DOM, so they're unaffected by this.
          Every control below also renders as a div (role="button"/role
          from Reka's own SelectTrigger, tabindex="0") instead of its usual
          button tag - a <button> can't validly contain another <button>,
          and the browser silently restructuring that invalid nesting
          while parsing the server-rendered HTML caused a real hydration
          mismatch here (broken layout on a hard refresh, gone on a
          client-side navigation) - see GraphicNovelList.vue's identical
          fix.
        -->
        <div
          class="ml-auto flex items-center gap-2"
          @click.stop
        >
          <!-- Voting only accepts mutation while status is "new" (see
               design.md "Voting closes once a suggestion leaves 'new'") -
               buttons stay visible but disabled once triaged, since the
               score/counts are still meaningful, just no longer changeable. -->
          <UTooltip
            text="Voting is closed for this suggestion"
            :disabled="item.suggestion.status === 'new'"
          >
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-0.5">
                <UButton
                  as="div"
                  role="button"
                  :tabindex="item.suggestion.status !== 'new' ? undefined : 0"
                  icon="i-lucide-thumbs-up"
                  size="xs"
                  variant="ghost"
                  :color="item.suggestion.myVote === true ? 'primary' : 'neutral'"
                  :disabled="item.suggestion.status !== 'new'"
                  :aria-label="`Upvote &quot;${item.suggestion.title}&quot;`"
                  @click="emit('vote', item.suggestion.id, true, item.suggestion.myVote)"
                />
                <span class="text-xs font-medium tabular-nums">{{ item.suggestion.upvoteCount }}</span>
              </div>
              <div class="flex items-center gap-0.5">
                <UButton
                  as="div"
                  role="button"
                  :tabindex="item.suggestion.status !== 'new' ? undefined : 0"
                  icon="i-lucide-thumbs-down"
                  size="xs"
                  variant="ghost"
                  :color="item.suggestion.myVote === false ? 'primary' : 'neutral'"
                  :disabled="item.suggestion.status !== 'new'"
                  :aria-label="`Downvote &quot;${item.suggestion.title}&quot;`"
                  @click="emit('vote', item.suggestion.id, false, item.suggestion.myVote)"
                />
                <span class="text-xs font-medium tabular-nums">{{ item.suggestion.downvoteCount }}</span>
              </div>
            </div>
          </UTooltip>

          <USelect
            v-if="isAdmin"
            as="div"
            tabindex="0"
            :model-value="item.suggestion.status"
            :items="STATUS_OPTIONS"
            size="sm"
            class="w-40"
            @update:model-value="(value) => emit('update-status', item.suggestion.id, value as SuggestionStatus)"
          />

          <UButton
            v-if="isAdmin"
            as="div"
            role="button"
            tabindex="0"
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            :aria-label="`Delete &quot;${item.suggestion.title}&quot;`"
            @click="pendingDelete = item.suggestion"
          />
        </div>
      </div>
    </template>

    <template #body="{ item }">
      <p class="text-sm whitespace-pre-wrap">
        <NumberMotif :text="item.suggestion.body" />
      </p>

      <SuggestionAdminResponse
        :suggestion="item.suggestion"
        :is-admin="isAdmin"
        :saving="savingCommentId === item.suggestion.id"
        @save="(comment) => emit('update-comment', item.suggestion.id, comment)"
      />
    </template>
  </UAccordion>

  <SuggestionDeleteModal
    :suggestion="pendingDelete"
    :open="pendingDelete !== null"
    @update:open="(value) => !value && (pendingDelete = null)"
    @deleted="emit('deleted')"
  />
</template>
