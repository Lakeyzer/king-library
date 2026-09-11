<script setup lang="ts">
definePageMeta({ layout: "default" });

const { setPageSeo } = useSeo();
setPageSeo({
  title: "Privacy Policy",
  description: "How King Library collects, uses, and protects your data.",
});
</script>

<template>
  <div class="max-w-2xl mx-auto py-16 space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Privacy Policy</h1>
      <p class="text-muted mt-1">
        King Library &middot; Effective 11 September 2026
      </p>
    </div>

    <p>
      King Library is a personal fan project. We collect only what we need to
      run the app, we never sell your data, and we try to be straightforward
      about everything we do with it.
    </p>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">1. What we collect</h2>
      <p>
        When you create an account we collect your
        <strong>email address</strong> (for authentication and account recovery)
        and your <strong>username</strong> (the name that appears on your
        profile).
      </p>
      <p>
        When you use the app we store the content you create: books you add to
        your collection, wishlist, or read list and your reading progress;
        adaptations you mark as watched or add to your watchlist; and any other
        content you choose to add such as ratings or notes.
      </p>
      <p>
        We do not track you across other websites and we do not collect any
        technical or analytics data beyond what you provide directly.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">2. How we use your information</h2>
      <p>
        We use your data to operate your account and the content you've stored,
        display your profile and collection, contribute your activity to
        anonymous site-wide statistics, send transactional emails such as
        password resets, and protect the security of the service.
      </p>
      <p>
        We do not use your data for advertising, profiling, or any automated
        decision-making.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">3. Aggregate statistics</h2>
      <UAlert
        color="neutral"
        variant="subtle"
        title="All users — including those with private profiles — contribute to the site's aggregate reading and watching statistics."
        description="These figures are always totals or percentages and can never be traced back to an individual account."
      />
      <p>
        For example: how many users have read <em>The Stand</em>, or which
        adaptation is most commonly marked as watched. No username, email, or
        any profile-level detail is ever included or derivable from these
        figures.
      </p>
      <p>
        If you delete your profile, your data is removed and the aggregate
        statistics are updated to reflect this.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">4. Sharing &amp; disclosure</h2>
      <p>
        We do not sell, rent, or trade your personal data. We share it only in
        these circumstances:
      </p>
      <ul class="list-disc pl-6 space-y-1">
        <li>
          <strong>Service providers</strong> — infrastructure providers
          (currently Supabase) that process data on our behalf under data
          processing agreements.
        </li>
        <li>
          <strong>Legal obligation</strong> — if required by law or court order,
          or to protect the safety of users.
        </li>
        <li>
          <strong>Public profiles</strong> — if your profile is set to public,
          your username and collection are visible to any visitor. You can make
          your profile private at any time in your account settings.
        </li>
      </ul>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">5. Your privacy settings</h2>
      <p>You control whether your profile is visible to others:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li>
          <strong>Public</strong> — your username, collection, read list, and
          watchlist are visible to all visitors.
        </li>
        <li>
          <strong>Private</strong> — none of your personal activity is visible
          to other users.
        </li>
      </ul>
      <p>
        Changing to private takes effect immediately. Regardless of this
        setting, your activity continues to contribute to anonymous aggregate
        statistics as described in section 3.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">6. Your rights</h2>
      <p>
        You can manage all of your data directly from your account settings:
      </p>
      <ul class="list-disc pl-6 space-y-1">
        <li>
          <strong>Access</strong> — view all the personal data associated with
          your profile.
        </li>
        <li>
          <strong>Correction</strong> — update your email address or any other
          information at any time.
        </li>
        <li>
          <strong>Deletion</strong> — delete your profile at any time. All your
          data is removed immediately and permanently.
        </li>
      </ul>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">7. Data retention</h2>
      <p>
        We keep your data for as long as your profile exists. When you delete
        your profile, all your data — email address, username, collection,
        lists, and reading progress — is removed immediately. Backups are purged
        within 90 days.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">8. Cookies &amp; browser storage</h2>
      <p>King Library uses only what's strictly necessary:</p>
      <ul class="list-disc pl-6 space-y-1">
        <li>
          <strong>Authentication token</strong> — a session cookie that keeps
          you logged in, expiring on sign-out or after inactivity.
        </li>
        <li>
          <strong>Preferences</strong> — local storage for UI settings such as
          your theme. This data never leaves your browser.
        </li>
      </ul>
      <p>
        We use no analytics cookies, advertising cookies, or third-party
        tracking scripts.
      </p>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">9. Changes to this policy</h2>
      <p>
        If we make material changes — such as collecting new categories of data
        — we will notify you by email at least 14 days before they take effect.
        Minor corrections may be made without notice; the effective date at the
        top always reflects the current version.
      </p>
    </div>

    <div class="border-t border-default pt-6 space-y-2">
      <h2 class="text-lg font-semibold">Contact</h2>
      <p>
        Questions or requests:
        <a href="mailto:contact.king.library@gmail.com" class="text-primary"
          >contact.king.library@gmail.com</a
        >
      </p>
      <p class="text-muted text-sm">
        King Library is a personal, non-commercial fan project and is not
        affiliated with Stephen King, his publishers, or rights holders.
      </p>
    </div>
  </div>
</template>
