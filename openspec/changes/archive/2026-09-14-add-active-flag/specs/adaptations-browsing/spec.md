## MODIFIED Requirements

### Requirement: Adaptations page lists all canonical adaptations
The system SHALL provide a page that displays every active adaptation from the canonical list as a vertically stacked list, where each list item is laid out horizontally, showing a poster thumbnail on the left and, to its right, the title above a metadata row. The metadata row groups the release year and type at its leading edge, justified against an actions area reserved at its trailing edge. Inactive adaptations SHALL NOT appear in this list.

#### Scenario: Visiting the adaptations page
- **WHEN** a visitor navigates to the adaptations page
- **THEN** the page displays a list item for every active adaptation in the canonical list, showing its poster thumbnail, title, release year, and type

#### Scenario: An adaptation has a poster path
- **WHEN** an adaptation in the list has a TMDb poster path
- **THEN** its list item shows a poster thumbnail image built from that path

#### Scenario: An adaptation has no poster path
- **WHEN** an adaptation in the list has no TMDb poster path
- **THEN** its list item shows a generic placeholder image in place of a poster thumbnail

#### Scenario: An inactive adaptation is excluded from the list
- **WHEN** a visitor navigates to the adaptations page and one or more adaptations have an active flag of false
- **THEN** those inactive adaptations do not appear in the list
