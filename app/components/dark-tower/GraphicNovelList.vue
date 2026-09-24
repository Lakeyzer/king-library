<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { RelatedWorkOmnibusGroup } from '~/composables/useRelatedWorks'

interface Props {
  /** Every comic omnibus (category: 'comic', is_omnibus: true), each paired with the individual comics it collects - see useRelatedWorks().fetchOmnibusesWithComponents. */
  groups: RelatedWorkOmnibusGroup[]
}

const props = defineProps<Props>()

interface GraphicNovelAccordionItem extends AccordionItem {
  group: RelatedWorkOmnibusGroup
}

const items = computed<GraphicNovelAccordionItem[]>(() =>
  props.groups.map(group => ({
    value: group.omnibus.id,
    group
  }))
)

function omnibusMeta(group: RelatedWorkOmnibusGroup): string {
  const count = group.components.length
  return `${count} ${count === 1 ? 'comic' : 'comics'}`
}

// The default theme's "label" slot (wrapping our #default content) has no
// grow class of its own, so it only sizes to its content - leaving the
// trailing chevron sitting right after the title instead of at the row's
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
      <div class="flex w-full min-w-0 items-center gap-3">
        <ImageThumbnail
          :src="
            item.group.omnibus.cover_id
              ? getOpenLibraryCoverUrl(item.group.omnibus.cover_id, 'M')
              : null
          "
          :alt="`${item.group.omnibus.title} cover`"
          placeholder-icon="i-lucide-book-open-check"
          size="sm"
        />
        <div class="min-w-0 flex-1 text-left">
          <p class="truncate font-medium text-highlighted">
            <NumberMotif :text="item.group.omnibus.title" />
          </p>
          <p class="text-xs text-muted">
            Omnibus · <NumberMotif :text="omnibusMeta(item.group)" />
          </p>
        </div>

        <!--
          BookReadingActions ends up nested inside AccordionTrigger's own
          <button> here, since UAccordion always renders its trigger as a
          button with no way to opt out via its public API. @click.stop
          keeps a click on the actions control from also bubbling up and
          toggling the accordion - the dropdown/modals it opens are
          teleported elsewhere in the DOM, so they're unaffected by this.
          `nested` swaps its own trigger to a non-button tag - a <button>
          can't validly contain another <button>, and the browser silently
          restructuring that invalid nesting while parsing the
          server-rendered HTML is what caused a real hydration mismatch
          here (visible as a broken layout on a hard refresh, gone on a
          client-side navigation).
        -->
        <div
          class="ml-auto"
          @click.stop
        >
          <BookReadingActions
            nested
            domain="related"
            :work-id="item.group.omnibus.id"
            :work-title="item.group.omnibus.title"
            :work-key="item.group.omnibus.open_library_work_key"
            :publish-date="item.group.omnibus.publish_date"
          />
        </div>
      </div>
    </template>

    <template #body="{ item }">
      <ul class="flex flex-col divide-y divide-accented">
        <li
          v-for="component in item.group.components"
          :key="component.id"
          class="flex items-center gap-2 py-2"
        >
          <NuxtLink
            :to="`/works-by-others/${component.slug}`"
            class="group flex min-w-0 flex-1 items-center gap-2"
          >
            <ImageThumbnail
              :src="
                component.cover_id
                  ? getOpenLibraryCoverUrl(component.cover_id, 'M')
                  : null
              "
              :alt="`${component.title} cover`"
              placeholder-icon="i-lucide-book"
              size="sm"
            />
            <p
              class="truncate text-sm font-medium text-highlighted group-hover:text-primary"
            >
              <NumberMotif :text="component.title" />
            </p>
          </NuxtLink>

          <BookReadingActions
            domain="related"
            :work-id="component.id"
            :work-title="component.title"
            :work-key="component.open_library_work_key"
            :publish-date="component.publish_date"
            class="shrink-0"
          />
        </li>
      </ul>
    </template>
  </UAccordion>
</template>
