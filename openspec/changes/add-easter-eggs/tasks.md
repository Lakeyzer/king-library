## 1. Number-motif highlighting utility

- [x] 1.1 Add a composable/helper (e.g. `useNumberMotifs`) that splits a text string on the digit-boundary regex matching standalone `1999` or `19` (longer alternative first) and returns the text with each match wrapped in a `text-warning` span; verify with unit tests covering "chapter 19" (highlighted), "1999" (highlighted), "1987"/"1990"/"219" (not highlighted), and text with no match (returned unchanged) — no test framework exists in this repo; per user decision, verified manually via a standalone script instead of adding one, covering all the listed cases plus "1999 was the year, 19 was the number" and "19-20"
- [x] 1.2 Apply the helper wherever the app renders dynamic text - both bibliography data (titles, dates, counts, stats, descriptions on the works/short-stories/adaptations browsing and detail pages) and user-authored/account content (profile taglines and usernames, edition publishers/years, reading-timeline dates, Bookshelf/collection counts and titles, homepage stats and catalog counts, progress-bar text); verify by loading a page containing a work published in 1999 or a "19"-numbered stat and confirming the highlight renders (while a nearby 1987/1990-style year does not), and by setting a profile tagline to "19" and confirming it highlights on the Showcase, the account settings page, and the Following page
- [x] 1.2a Follow-up after manual testing found a profile tagline set to "19" wasn't highlighted - the first pass only covered bibliography-derived pages, missing profile/settings/following and several other components; audited every direct text interpolation across `app/**/*.vue` and wrapped every dynamic one (see design.md's number-motif decision for the full list and what was deliberately left unwrapped, and why)

## 2. Shared not-found page

- [x] 2.1 Create `app/error.vue` with the Overlook Hotel hallway/maze visual treatment and copy in the vein of "You've wandered into a room that isn't on the floor plan."; verify by navigating to a URL that matches no route and confirming this page renders
- [x] 2.2 Confirm the existing `createError`/`showError` calls for unmatched work, adaptation, and profile slugs still resolve to this same page (no per-page change expected since Nuxt routes 404s to `error.vue`); verify by visiting an unknown work slug, an unknown adaptation slug, and an unknown profile username and confirming each shows the Overlook-themed page
- [x] 2.3 Verify the not-found page still exposes a page-specific title/description per the seo-metadata capability's existing rules

## 3. Header easter eggs

- [x] 3.1 Add hover/tooltip text "That spells dark mode" to the color mode toggle in `AppHeader.vue`; verify by hovering the control and confirming the tooltip text
- [x] 3.2 Add a farewell message "Long days and pleasant nights" shown when a signed-in user signs out; verify by signing out and confirming the message appears before/as the session ends

## 4. Confirm dialog wording

- [x] 4.1 Update `BookshelfRemoveModal.vue`'s prompt copy to incorporate "Say true?" and its confirm button label to "Say thankya", leaving the Cancel action and destructive behavior unchanged; verify by opening the remove-tile dialog on a profile Bookshelf and confirming the new copy, and that Cancel and Confirm still behave as before

## 5. Room 217 search easter egg

- [x] 5.1 On the works browsing page, show "You weren't supposed to find this." in place of the normal empty-search state when the trimmed search text is exactly "217" and no work matches; verify by searching "217" on `/works` — implemented once in the shared `BibliographyBrowsePage.vue` that `/works` renders through
- [x] 5.2 Apply the same behavior to the short stories browsing page; verify by searching "217" on the short stories page — covered by the same shared-component change as 5.1
- [x] 5.3 Apply the same behavior to the adaptations browsing page; verify by searching "217" on the adaptations page — covered by the same shared-component change as 5.1

## 6. Charlie the Choo-Choo author loop

- [x] 6.1 On the work detail page, when the work's slug is `charlie-the-choo-choo`, render an author byline starting at "Beryl Evans"; verify by loading that work's detail page
- [x] 6.2 Add a reusable `ScrambleText.vue` component that animates its displayed text to a new value whenever its `text` prop changes, using a staggered letter-scramble/reveal effect; verify by manually toggling its prop between two different-length strings and confirming a scramble animation plays each time
- [x] 6.3 Loop the byline indefinitely between "Beryl Evans" and "Claudia y Inez Bachman" on a repeating interval (every 6 seconds) for as long as the page is mounted, rendering it through `ScrambleText`, and clear the interval (and any pending animation) on unmount; verify by watching the page for 15-20 seconds and confirming it keeps alternating, and by navigating away mid-loop and confirming no console errors or lingering timers
- [x] 6.4 Confirm no other work detail page shows this byline loop/animation behavior

## 7. Misery N-glitch

- [x] 7.1 Give the "N"/"n" text-to-nodes helper (`GlitchLetter.vue`) an `active` prop so call sites render plain text when inactive, and switch its treatment from a muted text color to reduced opacity (`opacity-40`); verify by toggling `active` and confirming inactive renders unchanged text
- [x] 7.2 Apply it, `:active="isMisery"`, to every text expression the Misery work detail page's own template renders (title, byline, type/description) and every text expression the Misery adaptation detail page's own template renders (title, directed-by line, type/runtime, overview/notes, stats labels), excluding the site header/footer and text generated inside shared, reused sub-components (reading/watch-status actions, edition list, connections lists); verify by loading each Misery page and visually confirming every N in the page's own text is faded, that other work/adaptation detail pages are unaffected, and that the excluded areas (header, footer, action buttons, edition list, connections lists) are not glitched

## 8. Final pass

- [x] 8.1 Run the project's lint/typecheck to confirm no regressions; verify the command exits successfully — `nuxt typecheck` passes; `eslint` on all newly created files passes cleanly (the repo-wide `pnpm lint` has ~2241 pre-existing style errors unrelated to this change, left untouched)
- [ ] 8.2 Manually walk through all eight easter eggs end-to-end per the tasks above and confirm each matches its spec scenario
