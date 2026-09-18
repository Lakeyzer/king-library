## 1. Fix footer justification (global)

- [x] 1.1 `app/app.config.ts`: add `ui.modal.slots.footer: "justify-end"` so every modal's footer is end-justified app-wide (the default Nuxt UI footer slot has no `justify-*` class). Verify by confirming `ui.modal.slots.footer` appears in `app.config.ts` and matches the pattern Nuxt UI documents for extending component slot classes.

## 2. Document the convention

- [x] 2.1 Add a "Modal action buttons" section to `.claude/skills/nuxt-conventions/SKILL.md` documenting: footer placement, right-justification, cancel-left-of-confirm order, confirm = `color="primary"` + default solid variant (or `color="error"` only in warning/destructive modals), cancel = `color="neutral" variant="soft"`. Verify by reading the section back and confirming it matches `specs/modal-actions/spec.md`.

## 3. Fix modals with a reversed or non-conforming confirm/cancel pair

- [x] 3.1 `app/components/DeleteAccountModal.vue`: swap footer button order so cancel renders before confirm; change cancel to `color="neutral" variant="soft"` (from `variant="ghost"`); confirm keeps `color="error"` (destructive action). Verify by reading the rendered footer left-to-right: Cancel, then "Permanently delete".
- [x] 3.2 `app/components/profile/BookshelfRemoveModal.vue`: change cancel button from `variant="ghost"` to `variant="soft"`; confirm keeps `color="error"` (destructive action). Verify order is already cancel-then-confirm and styling matches the spec.
- [x] 3.3 `app/components/book/FinishReadingModal.vue`: change cancel from `variant="ghost"` to `variant="soft"`; add explicit `color="primary"` to the confirm button.
- [x] 3.4 `app/components/book/MarkReadModal.vue`: change cancel from `variant="ghost"` to `variant="soft"`; add explicit `color="primary"` to the confirm button.
- [x] 3.5 `app/components/book/StartReadingModal.vue`: change cancel from `variant="ghost"` to `variant="soft"`; add explicit `color="primary"` to the confirm button.
- [x] 3.6 `app/components/book/UnmarkReadModal.vue`: change cancel from `variant="ghost"` to `variant="soft"`; confirm keeps `color="error"` (destructive action).
- [x] 3.7 `app/components/book/EditReadDatesModal.vue`: change cancel from `variant="ghost"` to `variant="soft"`; add explicit `color="primary"` to the confirm button.

## 4. Align dismiss-only footers

- [x] 4.1 `app/components/book/EditionsPickerModal.vue`: change the "Done" button from `variant="subtle"` to `color="neutral" variant="soft"`; leave the "Can't find your edition?" link button's `variant="ghost"` untouched. Verify the Open Library link button still renders to the left of "Done".
- [x] 4.2 `app/components/book/SearchWorkModal.vue`: change the "Cancel" button from `variant="ghost"` to `variant="soft"` (keep `color="neutral"`).

## 5. Verify

- [ ] 5.1 Manually open each of the 9 modified modals in the running app and confirm: footer buttons are right-justified, cancel/dismiss sits left of confirm where both exist, cancel/dismiss is neutral+soft, confirm is primary (or error only where destructive).
- [x] 5.2 Run the project's type-check/lint command and confirm it passes with no new errors introduced by the prop changes.
