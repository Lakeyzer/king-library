## MODIFIED Requirements

### Requirement: Work detail page is reachable by slug
The system SHALL provide a detail page for each active canonical King work, addressed by that work's slug, showing the work's title, type, original publish date, cover (when a cover identifier is known), and Dark Tower/Bachman flags when set. An inactive work's slug SHALL resolve the same as a slug matching no work.

#### Scenario: Visiting a work's detail page
- **WHEN** a visitor navigates to an active King work's detail page using its slug
- **THEN** the page displays that work's title, type, original publish date, cover (if a cover identifier is known), and Dark Tower/Bachman flags (if set)

#### Scenario: Slug does not match any work
- **WHEN** a visitor navigates to a work detail URL whose slug does not match any canonical King work
- **THEN** the system shows a not-found result instead of a detail page

#### Scenario: Slug matches an inactive work
- **WHEN** a visitor navigates to a work detail URL whose slug matches a canonical King work with an active flag of false
- **THEN** the system shows a not-found result instead of a detail page

### Requirement: Work detail page shows connected adaptations
The system SHALL show, on a work's detail page, every active adaptation based on that work, each linking to that adaptation's own detail page. Inactive adaptations SHALL NOT appear in this list.

#### Scenario: Work has one or more adaptations
- **WHEN** a visitor views the detail page of a work that one or more active adaptations are based on
- **THEN** the page lists each of those active adaptations, and selecting one takes the visitor to that adaptation's detail page

#### Scenario: Work has no adaptations
- **WHEN** a visitor views the detail page of a work with no adaptations based on it
- **THEN** the page shows no adaptations in its connections

#### Scenario: Work has only inactive adaptations
- **WHEN** a visitor views the detail page of a work whose only based-on adaptations have an active flag of false
- **THEN** the page shows no adaptations in its connections
