## Why

Modal confirm/cancel buttons are placed and styled differently across the app: `DeleteAccountModal` puts its confirm button before cancel (reversed order), most modals use `variant="ghost"` for cancel where the new convention calls for `variant="soft"`, and there's no single documented rule for footer button placement, order, or color/variant. New modals get built by copying whichever existing one is closest at hand, so the drift compounds. This change locks in one rule and brings every existing modal into line with it.

## What Changes

- Document a single modal action-button convention in `nuxt-conventions`: confirm/cancel buttons live in the modal footer, right-justified, cancel to the left of confirm; confirm is `color="primary"` (or `color="error"` only in warning/destructive modals) with the default `solid` variant; cancel is `color="neutral" variant="soft"`.
- Fix every existing modal with a footer confirm/cancel pair to match: `DeleteAccountModal`, `BookshelfRemoveModal`, `book/FinishReadingModal`, `book/MarkReadModal`, `book/StartReadingModal`, `book/UnmarkReadModal`, `book/EditReadDatesModal`.
- `DeleteAccountModal`'s button order is reversed today (confirm before cancel) — swap it to match the new left-to-right order.
- Every cancel button's `variant="ghost"` changes to `variant="soft"`.
- Confirm buttons gain an explicit `color="primary"` where currently unset, so the color is asserted rather than relied on as a default.
- `EditionsPickerModal` and `book/SearchWorkModal` don't have a confirm/cancel pair (dismiss-only or link+dismiss) — their existing single dismiss button is restyled to the cancel style (`color="neutral" variant="soft"`) for consistency, but no confirm button is added since there's nothing to confirm.
- `AuthModal` and `LinkEmailPasswordModal` submit through an inline form button in the body, not a footer confirm/cancel pair — out of scope for this change; they're a different interaction pattern (single inline submit, no explicit cancel affordance) and aren't touched here.

## Capabilities

### New Capabilities
- `modal-actions`: defines the standard placement, order, color, and variant rules for confirm/cancel action buttons in modals with a footer action pair.

### Modified Capabilities
(none — no existing capability spec currently governs modal button conventions)

## Impact

- `.claude/skills/nuxt-conventions/SKILL.md` — new documented convention section.
- `app/components/DeleteAccountModal.vue`
- `app/components/profile/BookshelfRemoveModal.vue`
- `app/components/book/FinishReadingModal.vue`
- `app/components/book/MarkReadModal.vue`
- `app/components/book/StartReadingModal.vue`
- `app/components/book/UnmarkReadModal.vue`
- `app/components/book/EditReadDatesModal.vue`
- `app/components/book/EditionsPickerModal.vue`
- `app/components/book/SearchWorkModal.vue`
- No database, API, or dependency changes.
