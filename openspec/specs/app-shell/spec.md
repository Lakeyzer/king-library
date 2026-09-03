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
The system SHALL define exactly one layout, the default layout, for the current scope of the app.

#### Scenario: No alternate layout is available
- **WHEN** a page is rendered
- **THEN** the default layout is the only layout available for it to use

### Requirement: Header displays site branding and primary navigation
The system SHALL render, on the leading side of the header, the site name "King Library", followed by a primary navigation menu with entries for Works, Short Stories, and Adaptations, each linking to its corresponding page. The system SHALL also render, on the trailing side of the header, an authentication entry point: a sign-in control when the visitor is signed out, or an account menu (linking to the profile page, with a sign-out action) when the visitor is signed in.

#### Scenario: Header navigation entries link to their pages
- **WHEN** a visitor selects a primary navigation entry (Works, Short Stories, or Adaptations) in the header
- **THEN** they are taken to that entry's corresponding page

#### Scenario: Signed-out visitor sees a sign-in entry point
- **WHEN** a signed-out visitor views the header
- **THEN** the header displays a sign-in control instead of an account menu

#### Scenario: Signed-in user sees an account menu
- **WHEN** a signed-in user views the header
- **THEN** the header displays an account menu instead of the sign-in control, offering a link to the profile page and a sign-out action

### Requirement: Header provides a color mode toggle
The system SHALL render a control on the trailing side of the header that lets a visitor switch between light and dark color modes.

#### Scenario: Toggling color mode
- **WHEN** a visitor activates the color mode control in the header
- **THEN** the app's color mode switches accordingly

### Requirement: Footer displays a non-affiliation disclaimer
The system SHALL render, in the footer of the default layout, a disclaimer stating that King Library is an unofficial, fan-made personal project with no affiliation to or endorsement by Stephen King or his representatives.

#### Scenario: Visiting any page with the default layout
- **WHEN** a visitor views a page that uses the default layout
- **THEN** the footer displays the non-affiliation disclaimer text
