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
