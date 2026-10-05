## ADDED Requirements

### Requirement: Header authentication entry point shows a loading state until sign-in state is known
Until the visitor's sign-in state is known in their browser, the system SHALL show a neutral placeholder in the header's authentication entry point, the same size as the controls that replace it. It SHALL then show the sign-in control or the account menu. The header SHALL NOT show the sign-in control to a signed-in visitor at any point while the page loads.

#### Scenario: Signed-in visitor opens a cached page
- **WHEN** a signed-in visitor opens a page served from the shared cache
- **THEN** the header shows the placeholder, then the account menu, and never shows the sign-in control in between

#### Scenario: Signed-out visitor opens a cached page
- **WHEN** a signed-out visitor opens a page served from the shared cache
- **THEN** the header shows the placeholder, then the sign-in control

#### Scenario: Placeholder does not shift the layout
- **WHEN** the placeholder is replaced by the sign-in control or the account menu
- **THEN** the surrounding header content does not move
