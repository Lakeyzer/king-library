## MODIFIED Requirements

### Requirement: Default layout is the only layout
The system SHALL define exactly two layouts for the current scope of the app: the default layout, and the detail layout (see "Detail layout provides a right-side connections sidebar").

#### Scenario: No alternate layout is available
- **WHEN** a page is rendered
- **THEN** the default layout and the detail layout are the only layouts available for it to use

## ADDED Requirements

### Requirement: Detail layout provides a right-side connections sidebar
The system SHALL provide a detail layout that renders the same header and footer as the default layout, plus a main content area paired with a sidebar on its trailing (right, in left-to-right reading order) side, and pages SHALL be able to opt into this layout to show related-item connections alongside their main content.

#### Scenario: A page uses the detail layout
- **WHEN** a page specifies the detail layout
- **THEN** the rendered page includes the header above and footer below, with the page's main content and a trailing-side sidebar both visible within the contained page area

#### Scenario: Detail layout on a narrow viewport
- **WHEN** a page using the detail layout is viewed on a narrow (mobile-width) viewport
- **THEN** the main content and sidebar are still both reachable, stacked rather than side-by-side
