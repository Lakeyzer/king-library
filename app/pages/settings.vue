<script setup lang="ts">
import type { UserIdentity } from '@supabase/supabase-js'

definePageMeta({ layout: 'default' })

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Settings',
  description:
    'Manage your King Library account, connected sign-in providers, and profile visibility.'
})

const user = useSupabaseUser()
const { profile, updateVisibility, updateTagline, uploadAvatar } = useProfile()

const { identities, fetchIdentities, linkProvider, unlinkProvider }
  = useIdentities()

const PROVIDER_META: Record<
  'email' | LinkableProvider,
  { label: string, icon: string }
> = {
  email: { label: 'Email', icon: 'i-lucide-mail' },
  google: { label: 'Google', icon: 'i-simple-icons-google' },
  discord: { label: 'Discord', icon: 'i-simple-icons-discord' }
}

function providerMeta(provider: string) {
  return PROVIDER_META[provider as keyof typeof PROVIDER_META] as
    | { label: string, icon: string }
    | undefined
}

const LINKABLE_PROVIDERS: LinkableProvider[] = ['google', 'discord']

const linkableProvidersNotLinked = computed(() =>
  LINKABLE_PROVIDERS.filter(
    provider =>
      !identities.value.some(identity => identity.provider === provider)
  )
)

const hasEmailIdentity = computed(() =>
  identities.value.some(identity => identity.provider === 'email')
)

const identitiesError = ref('')
const linking = ref<LinkableProvider | null>(null)
const unlinking = ref<string | null>(null)
const showLinkEmailPassword = ref(false)

await fetchIdentities().catch(() => {
  identitiesError.value = 'Could not load sign-in methods.'
})

async function handleLink(provider: LinkableProvider) {
  identitiesError.value = ''
  linking.value = provider

  try {
    await linkProvider(
      provider,
      `${window.location.origin}/confirm?next=/settings`
    )
  } catch {
    identitiesError.value
      = 'Could not start linking that provider. Please try again.'
    linking.value = null
  }
}

async function handleUnlink(identity: UserIdentity) {
  identitiesError.value = ''
  unlinking.value = identity.identity_id

  try {
    await unlinkProvider(identity)
  } catch {
    identitiesError.value
      = 'Could not unlink that sign-in method. Please try again.'
  } finally {
    unlinking.value = null
  }
}

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

const showDeleteModal = ref(false)
</script>

<template>
  <div class="max-w-md mx-auto py-16 space-y-8">
    <div class="flex items-center gap-4">
      <UAvatar
        :src="profile?.avatar_url ?? undefined"
        icon="i-lucide-user"
        size="xl"
      />
      <div class="flex-1">
        <h1 class="text-xl font-semibold">
          Settings
        </h1>
        <p class="text-muted mt-1">
          {{ profile?.username }}
        </p>
        <p class="text-muted">
          {{ user?.email }}
        </p>
      </div>
    </div>

    <div>
      <UFileUpload
        v-model="avatarFile"
        accept="image/jpeg,image/png,image/webp"
        variant="button"
        :label="avatarUploading ? 'Uploading…' : 'Upload avatar'"
        icon="i-lucide-image-up"
        :disabled="avatarUploading"
        class="h-24"
      />
      <p class="text-muted text-xs mt-1">
        JPEG, PNG, or WebP, up to 2MB.<span
          v-if="avatarUploaded"
          class="text-success"
        > · Uploaded</span>
      </p>
      <UAlert
        v-if="avatarError"
        color="error"
        variant="subtle"
        :title="avatarError"
        class="mt-2"
      />
    </div>

    <div>
      <UFormField
        label="Tagline"
        hint="Shown on your Showcase"
      >
        <UInput
          v-model="taglineDraft"
          placeholder="A tagline for your profile"
          maxlength="50"
          class="w-full"
          @blur="saveTagline"
        />
      </UFormField>
      <p class="text-muted text-xs mt-1">
        {{ taglineDraft.length }}/50<span v-if="taglineSaving"> · Saving…</span><span
          v-else-if="taglineSaved"
          class="text-success"
        > · Saved</span>
      </p>
      <UAlert
        v-if="taglineError"
        color="error"
        variant="subtle"
        :title="taglineError"
        class="mt-2"
      />
    </div>

    <div class="border-t border-default pt-6">
      <h2 class="font-medium">
        Sign-in methods
      </h2>
      <p class="text-muted text-sm mt-1">
        Link an additional way to sign in, or remove one you no longer use.
      </p>

      <UAlert
        v-if="identitiesError"
        color="error"
        variant="subtle"
        :title="identitiesError"
        class="mt-3"
      />

      <ul class="mt-4 space-y-2">
        <li
          v-for="identity in identities"
          :key="identity.identity_id"
          class="flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-2">
            <UIcon
              :name="providerMeta(identity.provider)?.icon ?? 'i-lucide-key'"
              class="size-5"
            />
            <span>{{
              providerMeta(identity.provider)?.label ?? identity.provider
            }}</span>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="identities.length <= 1"
            :loading="unlinking === identity.identity_id"
            @click="handleUnlink(identity)"
          >
            Unlink
          </UButton>
        </li>
      </ul>

      <div
        v-if="linkableProvidersNotLinked.length || !hasEmailIdentity"
        class="mt-4 flex flex-wrap gap-2"
      >
        <UButton
          v-if="!hasEmailIdentity"
          color="neutral"
          variant="subtle"
          :icon="PROVIDER_META.email.icon"
          @click="showLinkEmailPassword = true"
        >
          Link {{ PROVIDER_META.email.label }}/password
        </UButton>
        <UButton
          v-for="provider in linkableProvidersNotLinked"
          :key="provider"
          color="neutral"
          variant="subtle"
          :icon="PROVIDER_META[provider].icon"
          :loading="linking === provider"
          @click="handleLink(provider)"
        >
          Link {{ PROVIDER_META[provider].label }}
        </UButton>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="font-medium">
          Public profile
        </p>
        <p class="text-muted text-sm">
          When public, other users can see your collections and showcase.
        </p>
        <UAlert
          v-if="visibilityError"
          color="error"
          variant="subtle"
          :title="visibilityError"
          class="mt-2"
        />
      </div>
      <USwitch v-model="isPublic" />
    </div>

    <div class="border-t border-default pt-6">
      <h2 class="font-medium text-error">
        Delete account
      </h2>
      <p class="text-muted text-sm mt-1">
        This permanently deletes your account and all your data. This cannot be
        undone.
      </p>

      <UButton
        color="error"
        variant="subtle"
        class="mt-4"
        @click="showDeleteModal = true"
      >
        Delete account
      </UButton>
    </div>

    <DeleteAccountModal v-model:open="showDeleteModal" />
    <LinkEmailPasswordModal v-model:open="showLinkEmailPassword" />
  </div>
</template>
