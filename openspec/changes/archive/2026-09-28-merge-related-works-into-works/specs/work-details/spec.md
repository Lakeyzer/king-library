## MODIFIED Requirements

### Requirement: Work detail page is reachable by slug
The system SHALL provide a detail page for each active canonical King work, addressed by that work's slug, showing the work's title, type, original publish date, cover (when a cover identifier is known), and Dark Tower/Bachman flags when set. An inactive work's slug, or the slug of a By Other Hands work, SHALL resolve the same as a slug matching no work.

#### Scenario: Visiting a work's detail page
- **WHEN** a visitor navigates to an active King work's detail page using its slug
- **THEN** the page displays that work's title, type, original publish date, cover (if a cover identifier is known), and Dark Tower/Bachman flags (if set)

#### Scenario: Slug does not match any work
- **WHEN** a visitor navigates to a work detail URL whose slug does not match any canonical King work
- **THEN** the system shows a not-found result instead of a detail page

#### Scenario: Slug matches an inactive work
- **WHEN** a visitor navigates to a work detail URL whose slug matches a canonical King work with an active flag of false
- **THEN** the system shows a not-found result instead of a detail page

#### Scenario: Slug matches a By Other Hands work
- **WHEN** a visitor navigates to `/works/<slug>` where the slug belongs to a By Other Hands work
- **THEN** the system shows a not-found result instead of a detail page
