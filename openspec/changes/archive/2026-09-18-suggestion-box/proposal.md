## Why

There's currently no channel for users to leave feedback or feature ideas within the app itself. A suggestion box gives signed-in users a lightweight way to submit suggestions and browse what others have proposed, without needing an external tool.

## What Changes

- Add a new `/suggestion-box` route with a paginated list of all submitted suggestions, visible only to signed-in users.
- Add a footer link (with icon) to the suggestion box page, visible to everyone.
- Add a "New Suggestion" modal, reachable only when signed in, with a title input and a textarea for the suggestion body.
- Support posting either under the user's username or anonymously (display-only — the submitting user is still recorded for ownership/RLS purposes even when posted anonymously).
- Each suggestion in the list shows its title and author (username or "Anonymous") by default, as an accordion item; expanding it reveals the body text.
- Track a status per suggestion (new / rejected / confirmed / applied, defaulting to new), visible to every signed-in user as a badge; only admins can change it, via an inline control on the suggestion-box page.
- Title is capped at 100 characters and body at 1000 characters, enforced both in the form and at the database level.
- The suggestion list can be filtered by status, defaulting to "New" only, so a fresh page load surfaces unreviewed suggestions rather than the full history.
- The page carries a short message asking visitors to check whether their idea has already been suggested before submitting a new one.
- Any signed-in user can cast a thumbs-up or thumbs-down vote on a suggestion (one vote per user per suggestion), change its direction, or undo it by clicking the same direction again. Vote counts and the visitor's own vote are visible in the list. Voting (casting, changing, or undoing) is only allowed while a suggestion's status is "new" — once an admin triages it, voting closes, though existing vote counts stay visible.
- The list is sortable — "Newest" (the default) or "Most Popular" (net upvotes minus downvotes, descending).
- Admins can permanently delete a suggestion (e.g. spam or low-effort submissions), with a confirmation step first.
- The homepage's sidebar gains a small card (icon, title, description) linking to the Suggestion Box page, inviting visitors to vote on suggestions.

## Capabilities

### New Capabilities
- `suggestion-box`: Signed-in users can submit suggestions (title + body, optionally anonymous) and browse a paginated list of all suggestions; the page itself is gated to signed-in visitors. Each suggestion carries a status (new/rejected/confirmed/applied) that only admins can change.

### Modified Capabilities
- `app-shell`: Footer gains a link (with icon) to the suggestion box page.
- `homepage`: Sidebar gains a small card linking to the Suggestion Box page.

## Impact

- New DB table `suggestions` (with RLS) and a `useSuggestions()` composable.
- New page `pages/suggestion-box.vue` (or equivalent Nuxt route) and a suggestion-creation modal component.
- `app/layouts/default.vue` (or the footer component it renders): add the new link.
- Admin status changes require an `auth.users.raw_app_meta_data.role = 'admin'` claim (set manually via dashboard/SQL — no self-service UI to grant admin).
- New DB table `suggestion_votes` (with RLS) and an aggregate vote-count/score view.
- No changes to existing tables or other capabilities.
