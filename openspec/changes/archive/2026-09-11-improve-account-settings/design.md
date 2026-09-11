## Context

See proposal.md - Why. Relevant current state:

- `profiles.avatar_url` already exists and already flows through to `ProfileShowcase`/`UAvatar` (`app/pages/profile/[username].vue` → `Showcase.vue`), but nothing ever writes to it — there is no upload path and no Storage bucket.
- `profiles.username` is `unique` (case-sensitive, Postgres default) with a check constraint `^[a-z0-9_]{3,24}$` — lowercase is enforced at the DB level today, not just in the UI.
- `app/composables/useIdentities.ts` only knows about OAuth providers (`LinkableProvider = 'google' | 'discord'`); linking always redirects out via `supabase.auth.linkIdentity()`. There is no modal-based linking flow yet.
- `app/pages/settings.vue`'s delete flow is an inline expand/collapse block, not a modal — see `user-profile`'s current "Account deletion is permanent and irreversible" requirement, which this change extends rather than replaces.
- No Supabase Storage bucket exists in this project yet (`supabase/config.toml`'s `[storage.buckets.*]` section is present only as a commented-out example).
- `Showcase.vue` already renders a "Follow" button for non-owner visitors, but it's `disabled` behind a "Coming soon" tooltip — no follow relationship exists anywhere in the schema yet. `app/components/core/AppHeader.vue`'s `accountMenuItems` array (Profile/Settings/Sign out) and `app/middleware/onboarding.global.ts` (which currently gates only `/profile` and `/settings` behind sign-in) are the two other places that need to know about the new `/following` page.

## Goals / Non-Goals

**Goals:**
- Add an avatar upload path backed by Supabase Storage, reusing the existing `avatar_url` column.
- Add a `tagline` column and wire it into the Showcase's existing subtitle slot.
- Move delete confirmation into a modal and add the quote.
- Let an OAuth-only account add a password as a second sign-in method, via a modal, without a redirect.
- Relax the username format/uniqueness so capitals are allowed but two usernames can never collide by case alone, and surface that live while typing on onboarding.
- Wire up the existing Showcase "Follow" button into a real follow/unfollow relationship, and add a `/following` page listing who a signed-in user follows plus a sidebar of those followed users' currently-reading works.

**Non-Goals:**
- No image cropping/resizing pipeline — Supabase's image transformation API is Pro-plan-only and not enabled in this project (see `config.toml`); the client validates size/type only, and `UAvatar` handles display sizing/cropping via CSS as it already does for any image.
- No avatar removal affordance (revert to placeholder) — only upload/replace, per the request. Can be added later as a small follow-up if wanted.
- No ability to change an existing username from Settings — confirmed out of scope for this change; username capitalization/uniqueness rules apply to the existing onboarding flow only, where username is set today.
- No arbitrary email entry when linking email/password — see "Email/password linking" decision below.
- No SEO canonical-tag changes for case-insensitive profile URLs — the `seo-metadata` capability already sets per-page metadata; case-insensitive resolution just means both casings render the same page. Revisit only if duplicate-content behavior actually turns out to matter.
- No "followers" list or count (who follows *me*) anywhere in the UI, and no follow notifications or approval step — the request is one-directional ("who I follow"), so that's all this change builds. A followers-facing view is a natural future extension but a distinct feature, not implied by anything specced here.

## Decisions

### Avatar storage: a new `avatars` Storage bucket, public read, owner-scoped write

Mirrors the existing `profiles` table pattern (public read, owner-only write) rather than inventing a different access model:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatar images publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar images writable by owner"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar images updatable by owner"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar images deletable by owner"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

Objects are stored under `{user_id}/{filename}` so the owner-scoped policies above can check the first path segment against `auth.uid()`. `file_size_limit`/`allowed_mime_types` on the bucket enforce "small images only" at the storage layer as a backstop; the client also validates before uploading so a rejected file gives immediate feedback instead of waiting on a round trip.

**Alternative considered:** a private bucket with signed URLs. Rejected — avatars aren't sensitive (same public-by-default posture as the rest of `profiles`), and signed URLs would need periodic refreshing wherever an avatar is displayed, adding complexity with no privacy benefit here.

`useProfile()` gains `uploadAvatar(file: File)`: uploads to `avatars/{user.id}/{crypto.randomUUID()}-{file.name}`, then updates `profiles.avatar_url` to the resulting public URL (`supabase.storage.from('avatars').getPublicUrl(path)`). The previous object is left in place rather than deleted on replace — orphaned-object cleanup is a acceptable trade-off at this scale, not worth a delete-then-upload sequence that could momentarily leave a user with no avatar object if the delete races the upload.

### Tagline: a nullable `text` column with a length check constraint

```sql
alter table profiles add column tagline text;
alter table profiles add constraint profiles_tagline_length check (tagline is null or char_length(tagline) <= 50);
```

Enforced at the DB level (not just client-side) for the same reason every other format rule in this schema is (see `username`'s check constraint) — the constraint is the actual guarantee, client validation is just for fast feedback. `useProfile()` gains `updateTagline(tagline: string | null)`. `Showcase.vue`'s subtitle becomes `{{ tagline || 'Stephen King reading showcase' }}`.

### Username: allow mixed case, enforce uniqueness via a generated lowercase column

```sql
alter table profiles drop constraint profiles_username_format;
alter table profiles add constraint profiles_username_format check (
  username is null or username ~ '^[a-zA-Z0-9_]{3,24}$'
);

alter table profiles drop constraint profiles_username_key; -- the implicit `unique` from the original column definition
alter table profiles add column username_lower text generated always as (lower(username)) stored;
alter table profiles add constraint profiles_username_lower_unique unique (username_lower);
```

`username_lower` is a stored generated column rather than a bare functional unique index (`create unique index on profiles (lower(username))`) so it can also be the target of ordinary equality queries (`.eq('username_lower', candidate.toLowerCase())`) from `fetchProfileByUsername` — avoids `ilike` and its wildcard-escaping footguns for what's really an equality check, and keeps the composable query symmetric with every other `.eq(...)` lookup in this codebase. The displayed/stored `username` keeps the casing the user chose; `username_lower` is purely an internal lookup/uniqueness key, never shown.

This migration is safe against existing data: every username currently in the table already satisfies `^[a-z0-9_]{3,24}$` (today's constraint), so no two can already collide case-insensitively, and the new format constraint is strictly more permissive than the old one.

`useProfile()` changes:
- `fetchProfileByUsername(username)` queries `.eq('username_lower', username.toLowerCase())` instead of `.eq('username', username)` — this is what makes `/profile/[username]` resolve any casing to the same profile.
- New `checkUsernameAvailable(username)`: same `username_lower` lookup, returns a boolean, used by onboarding's live-feedback field. No new server route needed — `profiles` is already publicly readable, so this is a plain client-side query, debounced (~400ms) on input in `onboarding.vue`.
- `updateUsername(username)` is unchanged in shape; the DB constraints above do the enforcement, and a `23505` on `profiles_username_lower_unique` is what onboarding's existing catch block reports as "already taken" (same error-handling path as today, just a different constraint name behind it).

`Showcase.vue`'s `shareProfile()` lowercases the username when building the share URL: `${origin}/profile/${props.username.toLowerCase()}`.

### Email/password linking: password-only modal, no email field

The modal collects a password (+ confirmation) only — not an email address. The account's existing email (`user.value.email`, already established via OAuth) is shown read-only and reused. On submit, `useIdentities()` gains `linkEmailPassword(password: string)` calling `supabase.auth.updateUser({ password })`, then `fetchIdentities()` to refresh the linked-identities list so the new `email` identity appears alongside Google/Discord.

**Alternative considered:** let the user type an arbitrary email in the modal (a real "add a different email+password account" flow). Rejected — that would mean an email-change/confirmation flow layered on top of identity linking (Supabase sends a confirmation email for `updateUser({ email })` when the email actually changes), which is a materially bigger feature than "let me add a password to my existing account" and not what was asked for. If a user wants password sign-in under a different email, unlinking/relinking or changing their email separately already covers that.

`settings.vue`'s `LINKABLE_PROVIDERS`-driven UI gets a parallel, simpler branch: show a "Link email/password" button (opening the modal) whenever `identities` has no entry with `provider === 'email'`, alongside the existing OAuth link buttons — same visibility rule, different action (modal vs. redirect).

### Delete confirmation: wrap the existing inline block in a `UModal`

No change to the confirmation logic itself (type "DELETE" to confirm, `deleteAccount()`/`cancelDelete()`) — only the presentation moves from an inline `v-else` block into a `UModal`, consistent with how the `user-auth` capability already uses `UModal` for the sign-in form. The quote "Go then, there are other apps than these." is added as static text inside the modal, above the confirmation input.

### Follow relationships: a new `user_follows` table, RLS scoped to the follower

```sql
create table user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_no_self_follow check (follower_id <> followed_id),
  unique (follower_id, followed_id)
);

alter table user_follows enable row level security;

create policy "user_follows readable by follower"
  on user_follows for select
  using (follower_id = auth.uid());

create policy "user_follows insertable by follower"
  on user_follows for insert
  with check (follower_id = auth.uid());

create policy "user_follows deletable by follower"
  on user_follows for delete
  using (follower_id = auth.uid());
```

Only the follower can read their own rows — there's no "who follows me" query surface in this change (see Non-Goals), so there's no need for a `followed_id = auth.uid()` read policy yet; add one if/when a followers-facing feature is actually built. No update policy: following is a row's existence, not a mutable value — unfollow is a delete, matching how `user_short_story_reads` treats "read" as row-existence rather than a flag (see `supabase-conventions`).

Following a private profile is allowed (no check against `profiles.is_public` at write time) — the existing `user_books`/`user_book_editions` RLS policies already hide a private user's reading data from anyone but themselves, follower or not, so a followed-but-private user simply contributes nothing to the `/following` sidebar rather than needing a separate rule here (see "the sidebar" below). Blocking the follow itself would just be a redundant, duplicate privacy check — exactly what `supabase-conventions` warns against ("never write client-side checks... to decide whether to make a query").

### `useFollowing()`: a new composable, following the one-composable-per-domain convention

- `fetchFollowing(userId?)` — profiles the given user (defaults to `auth.uid()`) follows; joins `user_follows` → `profiles` on `followed_id`.
- `isFollowing(profileId)` — whether the signed-in user follows a given profile; backs the Showcase follow control's initial state.
- `follow(profileId)` / `unfollow(profileId)` — insert/delete a `user_follows` row.
- `fetchFollowingCurrentlyReading()` — powers the `/following` sidebar. Implemented as two queries rather than one PostgREST embed, the same "merge two result sets in the composable" pattern `useAdaptations()` already uses for its "based on" list (see `supabase-conventions`): first `fetchFollowing()` to get the followed profiles, then a single `user_books` query filtered with `.in('user_id', followedIds).eq('currently_reading', true)`, grouped client-side by `user_id`. A direct embed isn't available here since `user_follows` and `user_books` aren't FK-related to each other. RLS on `user_books` naturally drops any private followed user's rows out of the second query — no client-side privacy filtering needed.

### Showcase follow control replaces the disabled "Coming soon" button

`Showcase.vue`'s existing `v-else` branch (shown to non-owner visitors) swaps the disabled button + tooltip for a live control backed by `isFollowing`/`follow`/`unfollow`, mirroring the existing `isOwner`/`isPublic` conditional structure already in that template. A signed-out visitor (`user.value` is `null`) activating it calls the existing `useAuthModal().open()` (the same entry point `AppHeader.vue`'s "Sign in" button uses) instead of attempting a follow — no new sign-in UI needed.

### `/following` page reuses the existing detail layout

`app-shell`'s detail layout (main content + trailing sidebar, stacking on narrow viewports) already provides exactly the "list + sidebar" shell this page needs — `app/pages/following.vue` opts into it (`definePageMeta({ layout: 'detail' })`) rather than hand-building a two-column layout, the same way `work-details`/`adaptation-details` pages presumably already do for their connections sidebars. Main area: the followed-profiles list from `fetchFollowing()` (avatar, username, link to their showcase), with an empty state when the list is empty. Sidebar: `fetchFollowingCurrentlyReading()`'s grouped result, one block per followed user who has at least one currently-reading work; a followed user with nothing currently-reading (or whose data is hidden by privacy) is simply omitted from the sidebar rather than shown with an empty sub-state, and the sidebar as a whole shows one empty state when no followed user has anything to show.

`app/middleware/onboarding.global.ts`'s sign-in gate list (`to.path === '/profile' || to.path === '/settings'`) gains `/following`, matching how `/profile` and `/settings` are already gated.

`AppHeader.vue`'s `accountMenuItems` gains `{ label: 'Following', icon: 'i-lucide-users', to: '/following' }`, alongside the existing Profile/Settings/Sign out entries.

## Risks / Trade-offs

- **[Risk]** A stored generated column (`username_lower`) requires a table rewrite on a table that could theoretically be large. → **Mitigation**: `profiles` is one row per user, small at this project's scale (per `supabase-conventions`' "no performance case exists yet" posture elsewhere in this schema) — not a concern in practice.
- **[Risk]** Orphaned avatar objects accumulate in Storage as users replace their avatar (old objects are never deleted, per the decision above). → **Mitigation**: acceptable at this scale; if it ever matters, a scheduled cleanup (list objects under a user's prefix, delete all but the one referenced by `avatar_url`) is a follow-up, not a blocker for this change.
- **[Risk]** `supabase.auth.updateUser({ password })` on an account whose email came from OAuth and was never explicitly verified through Supabase's own email flow could behave unexpectedly on some provider configs. → **Mitigation**: surface the existing generic error-toast pattern (already used for link/unlink failures in `settings.vue`) if the call fails; no special-casing needed since the failure mode is "show an error, nothing changed," same as every other identity operation on this page.
- **[Risk]** `fetchFollowingCurrentlyReading()`'s second query grows linearly with how many people a user follows (`.in('user_id', followedIds)`), which is fine at this project's scale but would need pagination/limits if someone followed hundreds of users. → **Mitigation**: no guard needed now (same "no performance case exists yet" posture as the rest of this schema); revisit only if it becomes a real problem.

## Migration Plan

1. Local: `supabase migration new` for (a) the `avatars` bucket + storage policies, (b) `profiles.tagline`, (c) the username format/uniqueness change, (d) `user_follows` — four separate migrations, since they're independent concerns (per `supabase-conventions`, prefer `migration up` over `db reset` while iterating locally).
2. Verify locally: upload/replace/reject-oversized avatar flows, tagline set/clear, mixed-case username signup + live-availability check, `/profile/MixedCase` resolving the same as `/profile/mixedcase`, email/password linking on a Google-only test account, delete-modal flow, following/unfollowing from a Showcase (including the signed-out-visitor redirect to sign-in), and `/following` showing the right followed users and currently-reading sidebar (including a followed-but-private user contributing nothing to the sidebar).
3. Per `supabase-conventions` and this project's release process: push all four migrations to hosted (explicit go-ahead required) before merging to `main`.
