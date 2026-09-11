# app-shell Specification

## Purpose

Defines the shared page shell (header, main content area, footer) that pages use for consistent chrome and navigation across the app.

## Requirements

### Requirement: Default layout provides shared page chrome
The system SHALL provide a default layout that renders a header, a footer, and a contained main content area, and pages SHALL be able to opt into this layout to receive that chrome without re-implementing it.

#### Scenario: A page uses the default layout
- **WHEN** a page specifies the default layout
- **THEN** the rendered page includes a header above the page content and a footer below it, with the page's own content constrained within a contained main area

### Requirement: Default layout is the only layout
The system SHALL define exactly two layouts for the current scope of the app: the default layout, and the detail layout (see "Detail layout provides a right-side connections sidebar").

#### Scenario: No alternate layout is available
- **WHEN** a page is rendered
- **THEN** the default layout and the detail layout are the only layouts available for it to use

### Requirement: Detail layout provides a right-side connections sidebar
The system SHALL provide a detail layout that renders the same header and footer as the default layout, plus a main content area paired with a sidebar on its trailing (right, in left-to-right reading order) side, and pages SHALL be able to opt into this layout to show related-item connections alongside their main content.

#### Scenario: A page uses the detail layout
- **WHEN** a page specifies the detail layout
- **THEN** the rendered page includes the header above and footer below, with the page's main content and a trailing-side sidebar both visible within the contained page area

#### Scenario: Detail layout on a narrow viewport
- **WHEN** a page using the detail layout is viewed on a narrow (mobile-width) viewport
- **THEN** the main content and sidebar are still both reachable, stacked rather than side-by-side

### Requirement: Header displays site branding and primary navigation
The system SHALL render, on the leading side of the header, the site name "King Library", followed by a primary navigation menu with entries for Works, Short Stories, and Adaptations, each linking to its corresponding page. The system SHALL also render, on the trailing side of the header, an authentication entry point: a sign-in control when the visitor is signed out, or an account menu (linking to the profile page, to the `/following` page, and to the account settings page, with a sign-out action) when the visitor is signed in.

#### Scenario: Header navigation entries link to their pages
- **WHEN** a visitor selects a primary navigation entry (Works, Short Stories, or Adaptations) in the header
- **THEN** they are taken to that entry's corresponding page

#### Scenario: Signed-out visitor sees a sign-in entry point
- **WHEN** a signed-out visitor views the header
- **THEN** the header displays a sign-in control instead of an account menu

#### Scenario: Signed-in user sees an account menu
- **WHEN** a signed-in user views the header
- **THEN** the header displays an account menu instead of the sign-in control, offering a link to the profile page, a link to the `/following` page, a link to the account settings page, and a sign-out action

#### Scenario: Account menu's Following entry links to /following
- **WHEN** a signed-in user activates the "Following" entry in the account menu
- **THEN** they are taken to the `/following` page

### Requirement: Header provides a color mode toggle
The system SHALL render a control on the trailing side of the header that lets a visitor switch between light and dark color modes.

#### Scenario: Toggling color mode
- **WHEN** a visitor activates the color mode control in the header
- **THEN** the app's color mode switches accordingly

### Requirement: Header offers an install entry point when installation is available
The system SHALL render, on the trailing side of the header alongside the color mode toggle, an "Install App" control when the app has signaled that an install prompt is available and the app is not already running in installed (standalone) mode. Activating the control SHALL trigger the platform install prompt. The control SHALL NOT be rendered when no install prompt is available or when the app is already installed.

#### Scenario: Install control appears when installable
- **WHEN** a visitor views the header while the platform has signaled an install prompt is available and the app is not already installed
- **THEN** the header displays an "Install App" control on its trailing side

#### Scenario: Activating the install control
- **WHEN** a visitor activates the "Install App" control
- **THEN** the platform's install prompt is shown

#### Scenario: Install control hidden once installed
- **WHEN** a visitor views the header while the app is already running in installed (standalone) mode
- **THEN** the header does not display the "Install App" control

#### Scenario: Install control hidden when no prompt is available
- **WHEN** a visitor views the header on a platform or browser that has not signaled an install prompt is available (for example, before the signal fires, or on a platform that never fires it)
- **THEN** the header does not display the "Install App" control

### Requirement: Footer displays a non-affiliation disclaimer
The system SHALL render, in the footer of the default layout, a disclaimer stating that King Library is an unofficial, fan-made personal project with no affiliation to or endorsement by Stephen King or his representatives.

#### Scenario: Visiting any page with the default layout
- **WHEN** a visitor views a page that uses the default layout
- **THEN** the footer displays the non-affiliation disclaimer text
