## ADDED Requirements

### Requirement: Header displays site branding and primary navigation
The system SHALL render, on the leading side of the header, the site name "King Library", followed by a primary navigation menu with entries for Works, Short Stories, and Adaptations, each linking to its corresponding page.

#### Scenario: Header navigation entries link to their pages
- **WHEN** a visitor selects a primary navigation entry (Works, Short Stories, or Adaptations) in the header
- **THEN** they are taken to that entry's corresponding page

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
