## Why

The app currently has no way for a visitor to create an account or sign in, which blocks every user-specific feature already designed into the data model (collections, wishlists, read tracking, public profiles, stats) — none of it can be built or tested without an authenticated user to attach it to.

## What Changes

- Add a `UAuthForm`-in-`UModal` sign up / sign in flow supporting email+password and OAuth (Google, Discord now; Apple deferred to a later change), opened from a new header entry point.
- On signup, auto-create a `profiles` row (via a `handle_new_user()` DB trigger) with no username set yet.
- After signup (email or OAuth), redirect to an `/onboarding` page that requires the user to choose a unique username before proceeding.
- Gate `/profile`: visiting it without a username set redirects to `/onboarding` instead.
- Add a `/profile` page: shows the signed-in user's own account details, a public/private visibility toggle (`profiles.is_public`), and a "Delete account" action.
- Delete account performs a real, irreversible deletion of the `auth.users` row (cascading to `profiles` and all user data) via a Nuxt server route that uses the Supabase service-role key server-side only — the client never receives that key.
- Add a signed-in account menu / sign-out control to the header, replacing the sign-in entry point once authenticated.
- Profile page also shows the signed-in user's linked sign-in identities (email, Google, Discord) and lets them link an additional OAuth provider or unlink an existing one, as long as at least one identity remains linked.
- Document the one-time, manual Supabase dashboard steps to register and enable the Google and Discord OAuth providers (client IDs/secrets, redirect URLs) as part of this change's tasks — these are operator steps, not app code.
- Introduces the `profiles` table, its RLS policies, and the `handle_new_user()` trigger described in `supabase-conventions` — none of this exists in the schema yet.

## Capabilities

### New Capabilities
- `user-auth`: Sign up / sign in / sign out via email+password and OAuth providers (Google, Discord), presented as a `UAuthForm` inside a `UModal`, working correctly under SSR.
- `user-onboarding`: Post-signup username selection, and route-level gating that redirects any user without a username to onboarding.
- `user-profile`: The `/profile` page — viewing account details, toggling collection visibility (public/private), and deleting the account.

### Modified Capabilities
- `app-shell`: Header gains an authentication entry point (sign in) when signed out, and an account menu (profile link, sign out) when signed in.

## Impact

- **Database**: new `profiles` table, `handle_new_user()` trigger on `auth.users`, RLS policies on `profiles` — new migration(s) under `supabase/migrations/`.
- **Auth config**: Supabase Auth providers (Google, Discord) enabled in the Supabase dashboard, both locally (`supabase/config.toml`) and on the hosted project; OAuth app registration in each provider's own developer console.
- **App code**: new `useProfile()` composable, `components/AuthModal.vue` (or similar) wrapping `UAuthForm`, `pages/onboarding.vue`, `pages/profile.vue`, a Nuxt server route for account deletion, and route middleware for the onboarding gate.
- **Header**: `app/components/core/AppHeader.vue` gains sign-in/account-menu UI.
- **Env/config**: a new server-only Supabase service-role key env var (Vercel: server-side only, never `NUXT_PUBLIC_*`; local: `.env.development.local`), distinct from the existing anon key.
