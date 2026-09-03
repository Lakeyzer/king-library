## 1. Database schema

- [x] 1.1 Create migration for `profiles` table (`id` uuid PK/FK → `auth.users.id`, `username` text unique nullable with a check constraint for 3–24 lowercase letters/digits/underscore, `avatar_url` text nullable, `is_public` boolean default `true`, `created_at` timestamptz default `now()`) and verify `supabase migration up` applies cleanly against local Supabase
- [x] 1.2 Add the `handle_new_user()` `security definer` trigger function on `auth.users` insert that creates a `profiles` row with `username = null`, and verify a manual sign-up (email+password) via the app or Supabase Studio produces a matching `profiles` row with no username
- [x] 1.3 Add RLS policies on `profiles` (select: everyone; update: owner only) per `supabase-conventions`, and verify via Supabase Studio's policy tester or a quick script that an anon client can read but not update, and an authenticated client can update only its own row
- [x] 1.4 Confirm (and adjust if needed) that deleting an `auth.users` row cascades to its `profiles` row via the FK, and verify by deleting a test user locally (Studio or `auth.admin.deleteUser`) and confirming the `profiles` row disappears

## 2. OAuth provider setup (manual, operator task)

- [ ] 2.1 Register OAuth apps for Google and Discord in each provider's developer console with the local (`http://localhost:*`) and hosted callback redirect URIs, and verify each provider issues a client ID/secret
- [ ] 2.2 Add the two providers' client ID/secret to local `supabase/config.toml` (via `env()`-sourced local secrets) and to the hosted Supabase project's Auth provider settings, and verify `supabase start` picks up the local config with no errors and the hosted dashboard shows each provider enabled
- [x] 2.3 Update `supabase-conventions` to note the new `profiles` migration now exists (it was previously documented ahead of implementation) — verify by reading the skill after the edit

## 3. Auth core (sign up / sign in / sign out)

- [x] 3.1 Configure `@nuxtjs/supabase`'s `redirectOptions.callback` in `nuxt.config.ts` for the OAuth callback route, and verify an OAuth sign-in completes and lands back in the app signed in
- [x] 3.2 Add a `useAuthModal()` composable (`useState`-backed `isOpen`/`open`/`close`) and mount one `UModal` containing `UAuthForm` once in the default layout, and verify calling `open()` from the browser console (or a temporary button) opens the modal
- [x] 3.3 Wire `UAuthForm`'s email+password submission to `supabase.auth.signUp` / `signInWithPassword` depending on mode, and verify both sign-up and sign-in succeed end-to-end locally with a test email
- [x] 3.4 Wire `UAuthForm`'s `providers` (google, discord) to `supabase.auth.signInWithOAuth`, and verify each provider button redirects to that provider's consent screen (using the credentials from section 2)
- [x] 3.5 Surface incorrect-credentials and unconfigured-provider errors in the auth form rather than failing silently, and verify by submitting a wrong password and by temporarily disabling a provider
- [x] 3.6 Add a sign-out action (calls `supabase.auth.signOut()`), and verify signing out clears the session and subsequent page loads render as signed out

## 4. Onboarding and route gating

- [x] 4.1 Add `useProfile()` composable exposing the current user's profile row (SSR-safe fetch), and verify it returns the correct row for a signed-in user in both server-rendered and client-navigated loads
- [x] 4.2 Add global route middleware that redirects a signed-in user with no username to `/onboarding` (except when already there), and redirects away from `/onboarding` once a username is set, and verify by testing all four combinations (has/no username × on/off onboarding route)
- [x] 4.3 Build `pages/onboarding.vue` with a username field that checks the 3–24 char format client-side and submits via `useProfile()`, and verify submitting a valid, available username saves it and leaves onboarding
- [x] 4.4 Handle the "username already taken" case as a form error surfaced from the DB unique-constraint violation, and verify submitting a name already in use shows an error and does not navigate away
- [ ] 4.5 Verify end-to-end: a fresh sign-up (email and, separately, one OAuth provider) lands on `/onboarding`, and a direct visit to `/profile` before setting a username redirects to `/onboarding`

## 5. Profile page

- [x] 5.1 Build `pages/profile.vue` showing the signed-in user's username and email, gated to signed-in users with a username (signed-out visitors directed to sign in), and verify the correct data renders for a test account
- [x] 5.2 Add the public/private visibility toggle bound to `profiles.is_public` via `useProfile()`, and verify toggling it updates the DB row immediately (check via Supabase Studio)
- [x] 5.3 Add a "Delete account" control with an explicit confirmation step (e.g. a confirm dialog or type-to-confirm), and verify backing out of confirmation leaves the account untouched

## 6. Account deletion (server-side)

- [x] 6.1 Add a server-only `SUPABASE_SERVICE_ROLE_KEY` runtime config entry (private, not `public`) sourced from env, and verify it is absent from the client bundle (inspect built client JS or `nuxt build` output for the string)
- [x] 6.2 Add a Nuxt server route that reads the caller's session from the request, verifies it belongs to an authenticated user, and calls `supabase.auth.admin.deleteUser(userId)` using an admin client built from the service-role key, and verify calling it as a signed-in test user deletes that user's `auth.users` row and cascades to `profiles`
- [x] 6.3 Reject the server route's request if there is no valid session, and verify an unauthenticated request (no session cookie) is refused rather than deleting anything
- [x] 6.4 Wire the profile page's confirmed "Delete account" action to call this route, then sign the user out and redirect home, and verify the full flow locally against a disposable test account
- [x] 6.5 Verify a deleted account's credentials can no longer sign in (email+password or the OAuth identity used to create it)

## 7. Header integration

- [x] 7.1 Add a sign-in control to `AppHeader.vue` (trailing side) that calls `useAuthModal().open()`, shown only when signed out, and verify it renders correctly on server-rendered HTML for a signed-out request (view source, not just devtools)
- [x] 7.2 Add an account menu (profile link + sign-out) shown only when signed in, replacing the sign-in control, and verify it renders correctly on server-rendered HTML for a signed-in request
- [ ] 7.3 Verify no layout shift/flash between signed-out and signed-in header states on initial page load (SSR state matches client hydration)

## 8. Identity linking

- [x] 8.1 Set `enable_manual_linking = true` in `supabase/config.toml`, restart the local stack, and flip the equivalent "Enable Manual Linking" toggle in the hosted dashboard before this ships — verify `linkIdentity`/`unlinkIdentity` no longer reject with a manual-linking-disabled error locally
- [x] 8.2 Update `confirm.vue` to redirect to an optional `?next=` query param (defaulting to `/`) instead of always navigating home, and verify a plain sign-in still lands on `/` while a link flow (see 8.4) returns to `/profile`
- [x] 8.3 Add a composable (e.g. `useIdentities()`) wrapping `getUserIdentities()` / `linkIdentity()` / `unlinkIdentity()`, and verify it lists the identities for a signed-in test account
- [x] 8.4 Add a "Sign-in methods" section to `pages/profile.vue` listing each linked identity with an Unlink action, and a Link action for each OAuth provider (Google, Discord) not yet linked, passing `redirectTo` with `?next=/profile`, and verify linking a second provider to a test account adds it to the list and returns to `/profile`
- [x] 8.5 Disable/hide the Unlink action when it is the account's only remaining identity, and verify attempting to unlink the last identity is prevented both in the UI and by Supabase's own server-side check
- [ ] 8.6 Verify end-to-end: link a second provider, unlink the original, confirm sign-in still works with the remaining identity, and confirm the account can no longer sign in with the unlinked one
