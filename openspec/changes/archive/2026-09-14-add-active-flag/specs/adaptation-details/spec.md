## MODIFIED Requirements

### Requirement: Adaptation detail page is reachable by slug
The system SHALL provide a detail page for each active canonical adaptation, addressed by that adaptation's slug, showing the adaptation's title, type, release year, poster (when a poster path is known), and any free-text note. An inactive adaptation's slug SHALL resolve the same as a slug matching no adaptation.

#### Scenario: Visiting an adaptation's detail page
- **WHEN** a visitor navigates to an active adaptation's detail page using its slug
- **THEN** the page displays that adaptation's title, type, release year, poster (if a poster path is known), and note (if set)

#### Scenario: Slug does not match any adaptation
- **WHEN** a visitor navigates to an adaptation detail URL whose slug does not match any canonical adaptation
- **THEN** the system shows a not-found result instead of a detail page

#### Scenario: Slug matches an inactive adaptation
- **WHEN** a visitor navigates to an adaptation detail URL whose slug matches a canonical adaptation with an active flag of false
- **THEN** the system shows a not-found result instead of a detail page

### Requirement: Adaptation detail page shows what it's based on
The system SHALL show, on an adaptation's detail page, every active King work and every short story that adaptation is based on. Each King work SHALL link to that work's own detail page; each short story SHALL be shown without a link. Inactive King works SHALL NOT appear in this list.

#### Scenario: Adaptation based on one or more works
- **WHEN** a visitor views the detail page of an adaptation based on one or more active King works
- **THEN** the page lists each of those active works, and selecting one takes the visitor to that work's detail page

#### Scenario: Adaptation based on one or more short stories
- **WHEN** a visitor views the detail page of an adaptation based on one or more short stories
- **THEN** the page lists each of those short stories, without a link

#### Scenario: Universe-only adaptation has nothing to show
- **WHEN** a visitor views the detail page of a universe-only adaptation with no linked works or short stories
- **THEN** the page shows no "based on" connections

#### Scenario: Adaptation is based only on inactive works
- **WHEN** a visitor views the detail page of an adaptation whose only linked King works have an active flag of false, and it has no linked short stories
- **THEN** the page shows no "based on" connections
