<script setup lang="ts">
const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Profile settings',
  description: 'Change your King Library avatar, tagline and profile visibility.'
})

const { profile, updateVisibility, updateTagline, uploadAvatar } = useProfile()

const visibilityError = ref('')

const isPublic = computed({
  get: () => profile.value?.is_public ?? true,
  set: (value: boolean) => {
    visibilityError.value = ''
    updateVisibility(value).catch(() => {
      visibilityError.value = 'Could not update visibility. Please try again.'
    })
  }
})

const avatarFile = ref<File | null>(null)
const avatarUploading = ref(false)
const avatarUploaded = ref(false)
const avatarError = ref('')
let avatarUploadedTimeout: ReturnType<typeof setTimeout> | undefined

watch(avatarFile, async (file) => {
  if (!file) return

  avatarError.value = ''
  avatarUploading.value = true
  clearTimeout(avatarUploadedTimeout)
  avatarUploaded.value = false

  try {
    await uploadAvatar(file)
    avatarUploaded.value = true
    avatarUploadedTimeout = setTimeout(() => {
      avatarUploaded.value = false
    }, 1000)
  } catch (error) {
    avatarError.value
      = error instanceof Error
        ? error.message
        : 'Could not upload avatar. Please try again.'
  } finally {
    avatarUploading.value = false
    avatarFile.value = null
  }
})

const taglineDraft = ref(profile.value?.tagline ?? '')
const taglineError = ref('')
const taglineSaving = ref(false)
const taglineSaved = ref(false)
let taglineSavedTimeout: ReturnType<typeof setTimeout> | undefined

watch(
  () => profile.value?.tagline,
  (tagline) => {
    taglineDraft.value = tagline ?? ''
  }
)

async function saveTagline() {
  taglineError.value = ''
  taglineSaving.value = true
  clearTimeout(taglineSavedTimeout)
  taglineSaved.value = false

  try {
    await updateTagline(
      taglineDraft.value.trim() === '' ? null : taglineDraft.value.trim()
    )
    taglineSaved.value = true
    taglineSavedTimeout = setTimeout(() => {
      taglineSaved.value = false
    }, 1000)
  } catch {
    taglineError.value = 'Could not save tagline. Please try again.'
  } finally {
    taglineSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Avatar"
      description="Shown on your profile and next to your name across King Library."
      variant="subtle"
    >
      <div class="flex items-center gap-4">
        <UAvatar
          :src="profile?.avatar_url ?? undefined"
          icon="i-lucide-user"
          size="3xl"
        />
        <div class="min-w-0 flex-1">
          <UFileUpload
            v-model="avatarFile"
            accept="image/jpeg,image/png,image/webp"
            variant="button"
            :label="avatarUploading ? 'Uploading…' : 'Upload avatar'"
            icon="i-lucide-image-up"
            :disabled="avatarUploading"
          />
          <p class="text-muted text-xs mt-1">
            JPEG, PNG, or WebP, up to 2MB.<span
              v-if="avatarUploaded"
              class="text-success"
            > · Uploaded</span>
          </p>
        </div>
      </div>
      <UAlert
        v-if="avatarError"
        color="error"
        variant="subtle"
        :title="avatarError"
      />
    </UPageCard>

    <UPageCard
      title="Tagline"
      description="A short line shown on your Showcase."
      variant="subtle"
    >
      <div>
        <UInput
          v-model="taglineDraft"
          placeholder="A tagline for your profile"
          maxlength="50"
          aria-label="Tagline"
          class="w-full"
          @blur="saveTagline"
        />
        <p class="text-muted text-xs mt-1">
          <NumberMotif :text="`${taglineDraft.length}/50`" /><span v-if="taglineSaving"> · Saving…</span><span
            v-else-if="taglineSaved"
            class="text-success"
          > · Saved</span>
        </p>
      </div>
      <UAlert
        v-if="taglineError"
        color="error"
        variant="subtle"
        :title="taglineError"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="font-medium text-highlighted">
            Public profile
          </p>
          <p class="text-muted text-sm">
            When public, other users can see your collections and showcase.
          </p>
        </div>
        <USwitch
          v-model="isPublic"
          aria-label="Public profile"
        />
      </div>
      <UAlert
        v-if="visibilityError"
        color="error"
        variant="subtle"
        :title="visibilityError"
      />
    </UPageCard>
  </div>
</template>
