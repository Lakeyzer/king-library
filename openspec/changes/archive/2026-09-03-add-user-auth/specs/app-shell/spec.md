## MODIFIED Requirements

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
