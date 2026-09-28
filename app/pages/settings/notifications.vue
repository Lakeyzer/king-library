<script setup lang="ts">
import { EMAIL_PREFERENCE_OPTIONS } from '~/composables/useEmailPreferences'
import type { EmailPreferenceKey } from '~/composables/useEmailPreferences'

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Notification settings',
  description: 'Choose which emails King Library sends you.'
})

const { preferences: emailPreferences, fetchPreferences, updatePreference }
  = useEmailPreferences()

await useAsyncData('email-preferences', fetchPreferences)

const emailPreferenceError = ref('')

// updatePreference() only writes the shared state once the upsert
// succeeds, so a failed save leaves the switch showing the saved value.
function setEmailPreference(key: EmailPreferenceKey, enabled: boolean) {
  emailPreferenceError.value = ''
  updatePreference(key, enabled).catch(() => {
    emailPreferenceError.value = 'Could not update email settings. Please try again.'
  })
}
</script>

<template>
  <UPageCard
    title="Email notifications"
    description="Choose which emails King Library sends you. Notifications in the app are always shown."
    variant="subtle"
  >
    <UAlert
      v-if="emailPreferenceError"
      color="error"
      variant="subtle"
      :title="emailPreferenceError"
    />

    <div class="space-y-4">
      <div
        v-for="option in EMAIL_PREFERENCE_OPTIONS"
        :key="option.key"
        class="flex items-center justify-between gap-4"
      >
        <div>
          <p class="font-medium text-highlighted">
            {{ option.label }}
          </p>
          <p class="text-muted text-sm">
            {{ option.description }}
          </p>
        </div>
        <USwitch
          :model-value="emailPreferences[option.key]"
          :aria-label="option.label"
          @update:model-value="(value) => setEmailPreference(option.key, value)"
        />
      </div>
    </div>
  </UPageCard>
</template>
