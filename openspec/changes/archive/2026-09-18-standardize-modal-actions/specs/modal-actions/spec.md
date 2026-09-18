## Purpose

Defines the standard placement, order, color, and variant for confirm/cancel action buttons in modals that have a footer action pair, so every modal in the app behaves and looks the same way regardless of who builds it or when.

## ADDED Requirements

### Requirement: Modal footer holds confirm/cancel actions
A modal that offers a confirm action and a cancel/dismiss action SHALL place both as buttons in the modal's footer, not in the body.

#### Scenario: A confirmation modal renders its actions
- **WHEN** a modal with a confirm and a cancel action is rendered
- **THEN** both actions appear as buttons inside the modal's footer area

### Requirement: Footer actions are right-justified with cancel left of confirm
The modal footer SHALL right-justify its action buttons, and WHEN both a cancel and a confirm button are present, the cancel button SHALL appear to the left of the confirm button.

#### Scenario: Footer button order
- **WHEN** a modal footer renders both a cancel button and a confirm button
- **THEN** the buttons are justified to the end (right) of the footer, with cancel positioned immediately to the left of confirm

### Requirement: Confirm button uses primary styling by default
The confirm button SHALL use `color="primary"` with the default (solid) button variant, unless the modal is a warning/destructive confirmation.

#### Scenario: Standard confirm action
- **WHEN** a modal's action is not destructive (e.g. saving, starting, finishing)
- **THEN** its confirm button is rendered with `color="primary"` and the default solid variant

### Requirement: Warning modals may use error color on confirm
A modal confirming a destructive or irreversible action (deleting, permanently removing, unmarking data that cannot be recovered) SHALL be permitted to render its confirm button with `color="error"` instead of `color="primary"`, using the default solid variant.

#### Scenario: Destructive confirm action
- **WHEN** a modal's confirm action permanently deletes or removes data
- **THEN** its confirm button may be rendered with `color="error"` in place of `color="primary"`

#### Scenario: Non-destructive modal does not use error color
- **WHEN** a modal's confirm action is not destructive or irreversible
- **THEN** its confirm button is not rendered with `color="error"`

### Requirement: Cancel button uses neutral soft styling
The cancel button SHALL be rendered with `color="neutral"` and `variant="soft"`.

#### Scenario: Cancel action styling
- **WHEN** a modal footer renders a cancel button
- **THEN** the button uses `color="neutral"` and `variant="soft"`
