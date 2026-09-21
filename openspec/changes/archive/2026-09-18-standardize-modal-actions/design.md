## Context

See `proposal.md` - Why for the motivation. Today's inconsistencies, surveyed across all `*Modal.vue` components in `app/components/`:

- `DeleteAccountModal.vue`: confirm button rendered *before* cancel in the footer (reversed order).
- `BookshelfRemoveModal.vue`, `book/FinishReadingModal.vue`, `book/MarkReadModal.vue`, `book/StartReadingModal.vue`, `book/UnmarkReadModal.vue`, `book/EditReadDatesModal.vue`: correct left-to-right order (cancel, confirm) but cancel uses `variant="ghost"` instead of `variant="soft"`, and several confirm buttons don't set `color` explicitly.
- `EditionsPickerModal.vue`, `book/SearchWorkModal.vue`: no confirm action at all — dismiss-only (or dismiss + external link) footers.
- `AuthModal.vue`, `LinkEmailPasswordModal.vue`: submit happens via an inline form button in the modal body (`UAuthForm`'s own submit slot, or a `block` button inside a `UForm`), not a footer action pair.

All modals use Nuxt UI's `UModal` with its `#footer="{ close }"` slot. **Correction during implementation:** the generated theme (`.nuxt/ui/modal.ts`) shows the footer slot's base class is `"flex items-center gap-1.5 p-4 sm:px-6"` — no `justify-end` — so footer buttons render left-aligned by default, not end-justified as originally assumed here. Confirmed by inspecting the running app after the per-modal button fixes below.

## Goals / Non-Goals

**Goals:**
- One documented rule for footer confirm/cancel placement, order, color, and variant.
- Every existing modal with a footer confirm/cancel pair conforms to it.

**Non-Goals:**
- Changing modals that don't use a footer confirm/cancel pair (`AuthModal`, `LinkEmailPasswordModal`) to adopt one — they're a different interaction pattern (inline form submit) and out of scope here.
- Introducing a footer action pair where none currently exists conceptually (`SearchWorkModal` has nothing to confirm; its list selection *is* the action).
- Touching modal body content, titles, descriptions, or any non-footer layout.

## Decisions

**Where the rule lives: `nuxt-conventions` skill, not a new skill.** The user asked whether a dedicated skill is warranted ("nuxt skill maybe?"). `nuxt-conventions` already owns "Nuxt UI first" component conventions and is the skill every `.vue` file is required to consult before being written — a new skill would fragment that single source of truth for a rule that's a natural subsection of it, and add a second file to remember to check. Add a new `## Modal action buttons` section there rather than creating `modal-conventions` or similar as its own skill.

**Dismiss-only footers get the cancel style, not a new third style.** `EditionsPickerModal`'s "Done" and `SearchWorkModal`'s "Cancel" aren't confirm actions, but they're still the dismissive/neutral action in their footer. Restyling them to `color="neutral" variant="soft"` keeps every footer button in the app drawn from the same two-style vocabulary (primary/error confirm, neutral-soft dismiss) instead of introducing a third style for a single-button case.

**Confirm color asserted explicitly, not left to default.** Several modals (`FinishReadingModal`, `MarkReadModal`, `StartReadingModal`, `EditReadDatesModal`) currently omit `color` on the confirm button and rely on Nuxt UI's `primary` default. Setting it explicitly everywhere means the convention is visible at each call site and doesn't silently break if the app's default button color config ever changes.

**Right-justification is a single global `app.config.ts` override, not a per-modal prop.** Since the footer isn't end-justified by default (see Context correction above), and the rule ("justified at the end") applies to every modal in the app, not just the ones with a confirm/cancel pair, the fix belongs in `app/app.config.ts` under `ui.modal.slots.footer: "justify-end"` — Nuxt UI's documented mechanism for extending a component's default theme slots app-wide. This is one line in one file instead of repeating a `:ui="{ footer: 'justify-end' }"` prop on every `UModal` usage, and it also covers modals outside this change's scope (`AuthModal`, `LinkEmailPasswordModal`, and any future modal) for free.

## Risks / Trade-offs

- [Restyling `EditionsPickerModal`'s "Can't find your edition?" link button] → It stays `variant="ghost"` since it isn't the dismiss action (informational external link) — only the "Done" button next to it changes to `soft`. Called out explicitly in tasks so it isn't swept up by mistake.
- [Visual change to seven+ modals at once] → Low risk: this is a color/variant/order change on existing Nuxt UI `UButton` props, not new markup or logic. Manual testing per modal is listed in tasks.

## Open Questions

None — scope and rule are fully specified above.
