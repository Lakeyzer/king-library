<script setup lang="ts">
import type { UserIdentity } from '@supabase/supabase-js'

definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { profile, updateVisibility } = useProfile()

const { identities, fetchIdentities, linkProvider, unlinkProvider } = useIdentities()

const PROVIDER_META: Record<'email' | LinkableProvider, { label: string, icon: string }> = {
  email: { label: 'Email', icon: 'i-lucide-mail' },
  google: { label: 'Google', icon: 'i-simple-icons-google' },
  discord: { label: 'Discord', icon: 'i-simple-icons-discord' }
}

function providerMeta(provider: string) {
  return PROVIDER_META[provider as keyof typeof PROVIDER_META] as { label: string, icon: string } | undefined
}

const LINKABLE_PROVIDERS: LinkableProvider[] = ['google', 'discord']

const linkableProvidersNotLinked = computed(() =>
  LINKABLE_PROVIDERS.filter(provider => !identities.value.some(identity => identity.provider === provider))
)

const identitiesError = ref('')
const linking = ref<LinkableProvider | null>(null)
const unlinking = ref<string | null>(null)

await fetchIdentities().catch(() => {
  identitiesError.value = 'Could not load sign-in methods.'
})

async function handleLink(provider: LinkableProvider) {
  identitiesError.value = ''
  linking.value = provider

  try {
    await linkProvider(provider, `${window.location.origin}/confirm?next=/profile`)
  } catch {
    identitiesError.value = 'Could not start linking that provider. Please try again.'
    linking.value = null
  }
}

async function handleUnlink(identity: UserIdentity) {
  identitiesError.value = ''
  unlinking.value = identity.identity_id

  try {
    await unlinkProvider(identity)
  } catch {
    identitiesError.value = 'Could not unlink that sign-in method. Please try again.'
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

const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteConfirmText.value = ''
  deleteError.value = ''
}

async function deleteAccount() {
  deleteError.value = ''
  deleting.value = true

  try {
    await $fetch('/api/account', { method: 'DELETE' })
    await supabase.auth.signOut()
    await navigateTo('/')
  } catch {
    deleteError.value = 'Something went wrong deleting your account. Please try again.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-16 space-y-8">
    <div>
      <h1 class="text-xl font-semibold">
        Profile
      </h1>
      <p class="text-muted mt-1">
        {{ profile?.username }}
      </p>
      <p class="text-muted">
        {{ user?.email }}
      </p>
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
            <span>{{ providerMeta(identity.provider)?.label ?? identity.provider }}</span>
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
        v-if="linkableProvidersNotLinked.length"
        class="mt-4 flex flex-wrap gap-2"
      >
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
          When public, other users can see your collections.
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
        This permanently deletes your account and all your data. This cannot be undone.
      </p>

      <UButton
        v-if="!showDeleteConfirm"
        color="error"
        variant="subtle"
        class="mt-4"
        @click="showDeleteConfirm = true"
      >
        Delete account
      </UButton>

      <div
        v-else
        class="mt-4 space-y-3"
      >
        <UFormField label="Type &quot;DELETE&quot; to confirm">
          <UInput
            v-model="deleteConfirmText"
            placeholder="DELETE"
          />
        </UFormField>

        <UAlert
          v-if="deleteError"
          color="error"
          variant="subtle"
          :title="deleteError"
        />

        <div class="flex gap-2">
          <UButton
            color="error"
            :disabled="deleteConfirmText !== 'DELETE'"
            :loading="deleting"
            @click="deleteAccount"
          >
            Permanently delete
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            @click="cancelDelete"
          >
            Cancel
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
