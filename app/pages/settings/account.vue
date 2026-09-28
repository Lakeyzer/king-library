<script setup lang="ts">
import type { UserIdentity } from '@supabase/supabase-js'

const { setPageSeo } = useSeo()
setPageSeo({
  title: 'Account settings',
  description: 'Manage your King Library account details, connected sign-in providers, and account deletion.'
})

const user = useSupabaseUser()
const { profile } = useProfile()

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
      `${window.location.origin}/confirm?next=/settings/account`
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

const showDeleteModal = ref(false)
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Account"
      variant="subtle"
    >
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt class="text-muted">
          Username
        </dt>
        <dd class="text-highlighted min-w-0 truncate">
          <NumberMotif
            v-if="profile?.username"
            :text="profile.username"
          />
        </dd>
        <dt class="text-muted">
          Email
        </dt>
        <dd class="text-highlighted min-w-0 truncate">
          <NumberMotif
            v-if="user?.email"
            :text="user.email"
          />
        </dd>
      </dl>
    </UPageCard>

    <UPageCard
      title="Sign-in methods"
      description="Link an additional way to sign in, or remove one you no longer use."
      variant="subtle"
    >
      <UAlert
        v-if="identitiesError"
        color="error"
        variant="subtle"
        :title="identitiesError"
      />

      <ul class="space-y-2">
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
        class="flex flex-wrap gap-2"
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
    </UPageCard>

    <UPageCard
      title="Delete account"
      description="This permanently deletes your account and all your data. This cannot be undone."
      variant="subtle"
      :ui="{ title: 'text-error' }"
    >
      <div>
        <UButton
          color="error"
          variant="subtle"
          @click="showDeleteModal = true"
        >
          Delete account
        </UButton>
      </div>
    </UPageCard>

    <DeleteAccountModal v-model:open="showDeleteModal" />
    <LinkEmailPasswordModal v-model:open="showLinkEmailPassword" />
  </div>
</template>
