## Why

When an admin triages a suggestion, the only feedback the author gets is a status badge they have to go back and look for. Admins also can't explain a decision (why something was rejected, what "confirmed" means in practice). An admin response plus push-style notifications close that loop: authors hear back without checking the Suggestion Box, and they see why.

## What Changes

- Admins can write one optional, editable **admin response** per suggestion. Every signed-in user sees it in the suggestion's expanded body. Admins can edit or clear it inline on the Suggestion Box page.
- New **notification center** at `/notifications` (sign-in required). It lists the signed-in user's notifications, newest first, and marks them read when the page is viewed.
- A notification is created for a suggestion's author when:
  - an admin changes that suggestion's status, or
  - an admin adds or changes the admin response on it.
  Anonymous suggestions still notify their author, since `user_id` is always recorded. An admin acting on their own suggestion is notified too.
- A **status change also sends an email** to the author through Resend. A new admin response creates an in-app notification only, with no email.
- New **"Email notifications"** section on the Settings page, with one toggle per email type. For now it has a single "Suggestion updates" toggle, which is on by default and only controls the email. In-app notifications are always created. Preferences live in their own private table with one column per email type, so later emails (a planned "someone followed you" email is the first) each add one column and one toggle. This change doesn't build the follower email or its toggle.
- The header's **account menu** gets a "Notifications" entry. The account menu button shows a **dot** while the user has unread notifications. The dot and the count update **live** through Supabase Realtime when a notification arrives, without navigating or reloading. A notification that arrives while the app is open also shows a **toast**. Notifications that were already waiting when you open the site only show the dot and count.
- The admin status change moves from a direct client-side Supabase update to a Nuxt server route, which can send the email after the update succeeds.

## Capabilities

### New Capabilities
- `notifications`: the notification center page, when notifications are created, read/unread state, the status-change email, and per-type email preferences.

### Modified Capabilities
- `suggestion-box`: adds the admin response (write/edit/clear by admins, visible to all signed-in users).
- `app-shell`: the account menu gains a Notifications entry, and the account menu button gains an unread indicator.

## Impact

- **Database**:
  - New `notifications` table (owner-only RLS, no client insert).
  - New `admin_comment` and `admin_comment_updated_at` columns on `suggestions`, with column-level update grants widened for admins.
  - New `email_preferences` table: one row per user, one boolean column per email type (starting with `suggestion_updates`), and owner-only RLS. A missing row means all defaults.
  - A `security definer` trigger on `suggestions` that creates the notifications.
  - `suggestions_with_author` view extended with the response columns.
- **Server**:
  - New `server/api/suggestions/[id]/status.patch.ts`, which handles the admin status change and sends the email.
  - New Resend integration using `fetch` against the REST API, so no new dependency. It needs the `RESEND_API_KEY` and `EMAIL_FROM` runtime config/env vars, set on Vercel and locally.
  - New `server/utils/emailPreferences.ts`, which reads a user's preferences with defaults applied.
  - Sending needs a verified `king-library.com` domain in Resend.
- **Client**:
  - `useSuggestions` gets `updateAdminComment`, and `updateSuggestionStatus` now calls the server route.
  - New `useNotifications` composable, with shared unread state.
  - New `useEmailPreferences` composable.
  - New `app/pages/notifications.vue`.
  - Changes to `AppHeader.vue`, `SuggestionList.vue` and `settings.vue`.
  - `/notifications` is added to `isAuthGatedRoute` and the sitemap exclude list.
  - A Supabase Realtime subscription on `notifications` while signed in, which is the app's first use of Realtime. The `notifications` table is added to the `supabase_realtime` publication.
- **Privacy policy**: list Resend as a processor that receives the author's email address.
- **Generated types**: regenerate `app/types/database.types.ts`.
