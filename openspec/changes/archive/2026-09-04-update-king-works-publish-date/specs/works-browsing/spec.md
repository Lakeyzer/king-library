## MODIFIED Requirements

### Requirement: Works page lists all canonical King works
The system SHALL provide a page that displays every King work from the canonical bibliography as a vertically stacked list, where each list item is laid out horizontally, showing a cover thumbnail on the left and, to its right, the title above a metadata row. The metadata row groups the release year (the year component of the work's original publish date) and type at its leading edge, justified against an actions area reserved at its trailing edge.

#### Scenario: Visiting the works page
- **WHEN** a visitor navigates to the works page
- **THEN** the page displays a list item for every King work in the canonical bibliography, showing its cover thumbnail, title, release year, and type

#### Scenario: A work has a cover identifier
- **WHEN** a King work in the list has an Open Library cover identifier
- **THEN** its list item shows a cover thumbnail image built from that identifier

#### Scenario: A work has no cover identifier
- **WHEN** a King work in the list has no Open Library cover identifier
- **THEN** its list item shows a generic placeholder image in place of a cover thumbnail

### Requirement: Works list is sortable by title and release year
The system SHALL allow a visitor to sort the works list by title or by release year, in ascending or descending order. The release year sort SHALL order works by their full original publish date rather than by the displayed year alone, so that works sharing the same release year are still ordered relative to each other by their actual publish date.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the works list by title
- **THEN** the list items are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by release year
- **WHEN** a visitor chooses to sort the works list by release year
- **THEN** the list items are ordered by original publish date, and choosing the same sort again reverses the order

#### Scenario: Two works share the same release year
- **WHEN** the works list is sorted by release year in ascending order and two works have the same release year but different original publish dates
- **THEN** the work with the earlier original publish date appears first
