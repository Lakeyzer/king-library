## ADDED Requirements

### Requirement: Footer displays a link to the Suggestion Box page
The system SHALL render, in the footer of the default layout, a link with an icon to the Suggestion Box page, visible to every visitor regardless of sign-in state.

#### Scenario: Visiting any page with the default layout
- **WHEN** a visitor views a page that uses the default layout
- **THEN** the footer displays a link with an icon to the Suggestion Box page

#### Scenario: Signed-out visitor selects the footer link
- **WHEN** a signed-out visitor activates the Suggestion Box link in the footer
- **THEN** they are taken toward the Suggestion Box page and, per the Suggestion Box page's own sign-in requirement, directed to sign in
