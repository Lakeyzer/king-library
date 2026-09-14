## MODIFIED Requirements

### Requirement: Works page lists all canonical King works
The system SHALL provide a page that displays every active King work from the canonical bibliography as a vertically stacked list, where each list item is laid out horizontally, showing a cover thumbnail on the left and, to its right, the title above a metadata row. The metadata row groups the release year (the year component of the work's original publish date) and type at its leading edge, justified against an actions area reserved at its trailing edge. Inactive King works SHALL NOT appear in this list.

#### Scenario: Visiting the works page
- **WHEN** a visitor navigates to the works page
- **THEN** the page displays a list item for every active King work in the canonical bibliography, showing its cover thumbnail, title, release year, and type

#### Scenario: A work has a cover identifier
- **WHEN** a King work in the list has an Open Library cover identifier
- **THEN** its list item shows a cover thumbnail image built from that identifier

#### Scenario: A work has no cover identifier
- **WHEN** a King work in the list has no Open Library cover identifier
- **THEN** its list item shows a generic placeholder image in place of a cover thumbnail

#### Scenario: An inactive work is excluded from the list
- **WHEN** a visitor navigates to the works page and one or more King works have an active flag of false
- **THEN** those inactive works do not appear in the list
