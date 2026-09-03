## Context

`@nuxtjs/supabase` is already installed and configured with `redirect: false` (see `nuxt.config.ts`), so no route protection exists yet — this change is what introduces it. No `profiles` table, auth UI, or user-facing routes exist. The app is SSR (not SPA/prerendered, except `/`), so auth state must be correct on the server-rendered response, not just after client hydration. See `proposal.md` for motivation and `supabase-conventions` for the `profiles` schema this change implements.

## Goals / Non-Goals

**Goals:**
- Email+password and OAuth (Google, Discord) sign up/sign in via one `UAuthForm` in a `UModal`.
- A single, uniform "missing username → onboarding" gate that covers both the post-signup redirect and the profile-page guard, rather than two separate mechanisms.
- Account deletion that actually removes the `auth.users` row, without ever shipping the service-role key to the client.

**Non-Goals:**
- Apple sign-in (explicitly deferred).
- Registering the OAuth apps themselves in each provider's developer console — that's a manual operator task, tracked as a task item, not app code.
- Any UI for viewing *other* users' public profiles — this change is the signed-in user's own `/profile` only. A public profile page is a separate future change.
- Building `user_books`/`user_adaptations`/etc. — those tables don't exist yet and aren't part of this change.

## Decisions

### One gate, not two: "missing username" drives both onboarding requirements
Rather than tracking "did this session just sign up" as a separate signal, a single check — does the signed-in user's profile have a `username`? — covers both proposal requirements: "redirect to onboarding after signup" and "redirect to onboarding if visiting `/profile` without a username." A brand-new account always has no username (see below), so the post-signup redirect falls out of the same check as the profile guard, implemented once as global route middleware rather than duplicated per-entry-point.

- **Alternative considered**: fire the onboarding redirect directly from the signup success handler. Rejected — it would need to be duplicated for email signup, OAuth signup, and (if ever added) invite/magic-link flows, and would drift from the profile-page guard over time.

### Route middleware checks username via SSR-safe profile fetch
A global Nuxt route middleware runs on every navigation (server and client). For a signed-in user (`useSupabaseUser()`), it fetches the profile row (`useProfile()`, `select username where id = auth.uid()`) and:
- if no username and the target route isn't `/onboarding` itself → redirect to `/onboarding`
- if a username exists and the target route is `/onboarding` → redirect to `/profile` (onboarding is a no-op past this point, per spec)

This runs server-side on first load (so a direct link to `/profile` without a username never flashes profile content before redirecting) and client-side on subsequent client navigations.

**Caveat found during implementation**: route middleware only runs on an actual navigation. The OAuth path always triggers one (the `/confirm` page navigates to `/` once signed in), but the email+password modal does not — closing the modal after `signUp`/`signInWithPassword` leaves the user on whatever page they were already on, so if that page is `/` there is no navigation for the middleware to intercept. The modal's own submit handler now performs the same "no username → `/onboarding`" check directly after a successful sign-up/sign-in, before closing. This isn't a second, divergent onboarding mechanism — it's the same check, invoked at the one point (modal close with no route change) where a navigation can't be assumed.

### Auth modal is global UI state, not a per-page component
A `useState`-backed composable (e.g. `useAuthModal()`) exposes `isOpen` + `open()`/`close()`. The header's sign-in control calls `open()`; the modal itself lives once in the default layout. This keeps the entry point in the header (per the `app-shell` delta) while allowing any future page to trigger the same modal without prop-drilling.

### `UAuthForm` wraps both email+password and OAuth in one component
Nuxt UI's `UAuthForm` is configured with `fields` (email, password) and `providers` (google, discord). Email+password submission calls `supabase.auth.signUp` / `signInWithPassword` depending on the form's active mode; each provider button calls `supabase.auth.signInWithOAuth({ provider })`. The OAuth redirect target is the app's own callback route, handled by `@nuxtjs/supabase`'s built-in confirm/callback handling (`redirectOptions.callback`), configured in `nuxt.config.ts`.

### `profiles` schema and RLS exactly as documented in `supabase-conventions`
No deviation from the skill's documented shape (`id` FK → `auth.users.id`, `username` unique, `avatar_url` nullable, `is_public` default `true`, `created_at`), **except** `username` must be nullable (the skill's table doesn't say NOT NULL, but this change is what makes "nullable until onboarding" load-bearing rather than incidental). The `handle_new_user()` trigger inserts a `profiles` row with `username = null` on every `auth.users` insert, regardless of signup method.

- Username format: 3–24 characters, lowercase letters/digits/underscore. Enforced with a `check` constraint in the migration (not just client-side validation) plus the existing `unique` constraint, so a race between two signups can't both claim the same name.

### Account deletion: server route + service-role key, scoped narrowly
`server/api/account.delete.ts` (or similar) reads the caller's session from the incoming request (via the Supabase server client bound to cookies — same session `@nuxtjs/supabase` already manages), confirms there is an authenticated user, and calls `supabase.auth.admin.deleteUser(userId)` using a **second**, admin-only Supabase client constructed with the service-role key. `auth.users` deletion cascades to `profiles` via its FK, so no separate profile-deletion step is needed.

- The service-role key is read from a server-only env var (e.g. `SUPABASE_SERVICE_ROLE_KEY`) via `runtimeConfig` (not `runtimeConfig.public`), so Nuxt never bundles it to the client.
- **This is a deliberate, narrow exception to the existing `supabase-conventions` rule that "the deployed app's env never has a service role key at all."** That rule was written before any deployed-runtime use case needed elevated privileges (only offline admin scripts did). Account deletion is a genuine exception: only `auth.admin.deleteUser` can remove an `auth.users` row, and only the service-role key can call it. The key is scoped to this one server route and never reaches client code. `supabase-conventions` should be updated to record this exception once this change lands (tracked as a task).
- **Alternative considered**: a Supabase Edge Function instead of a Nuxt server route. Rejected for now — it would mean a second deploy target and a second place secrets live, for no benefit over a Nuxt server route that already runs in a trusted, server-only context on Vercel.

### OAuth provider setup is manual, tracked as tasks
Registering each OAuth app (redirect URIs, client ID/secret) in Google Cloud Console / Discord Developer Portal, then entering those credentials in the Supabase Auth dashboard (hosted) and `supabase/config.toml` (local, via `env()`-sourced secrets), is a one-time manual sequence captured in `tasks.md`. It is not app code and has no spec-level behavior of its own beyond "the provider works once configured" (already covered by the `user-auth` spec's OAuth requirement).

### Identity linking: manual-link APIs, reusing the OAuth callback route
Listing/linking/unlinking identities uses `supabase.auth.getUserIdentities()` / `linkIdentity()` / `unlinkIdentity()`. These require `enable_manual_linking = true` in `config.toml` (and the equivalent toggle in the hosted dashboard) — off by default; this change turns it on. `linkIdentity()` shares the exact same OAuth-redirect shape as `signInWithOAuth()` (same `/confirm` callback), so no new callback route is needed — `confirm.vue` instead learns to redirect to an optional `?next=` target (defaulting to `/`) instead of always going home, so a link flow returns to `/profile` rather than the homepage.

Only OAuth providers get a "Link" affordance. Adding an email/password identity to an OAuth-only account is a different API (`updateUser({ email, password })`) with its own form and validation, and is not part of this change — a user who signed up via OAuth only won't see a way to add email/password sign-in yet.

Unlinking is blocked, both by disabling the control client-side and by Supabase's own server-side check, once only one identity remains — never let a user lock themselves out of their own account.

## Risks / Trade-offs

- **[Service-role key in the deployed app]** → narrowly scoped to one server route, verified against the caller's own session before use (never accepts an arbitrary user id from the client), and documented as an explicit, intentional exception rather than a silent convention break.
- **[Username race on signup]** → the DB `unique` constraint is the actual guarantee; the onboarding form's "already taken" check is a UX nicety, not the enforcement mechanism.
- **[OAuth providers not yet registered when this ships]** → the sign-in buttons render regardless; per spec, selecting an unconfigured provider surfaces an error rather than a broken redirect, so shipping ahead of provider registration is safe.

## Open Questions

- Should `avatar_url` be populated from the OAuth provider's profile picture at signup? Not required by any spec requirement in this change; can be answered later without affecting the approach here (defaults to `null` either way).
