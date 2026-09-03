## MODIFIED Requirements

### Requirement: Adaptations page lists all canonical adaptations
The system SHALL provide a page that displays every adaptation from the canonical list as a vertically stacked list, where each list item is laid out horizontally, showing a poster thumbnail on the left and, to its right, the title above a metadata row. The metadata row groups the release year and type at its leading edge, justified against an actions area reserved at its trailing edge.

#### Scenario: Visiting the adaptations page
- **WHEN** a visitor navigates to the adaptations page
- **THEN** the page displays a list item for every adaptation in the canonical list, showing its poster thumbnail, title, release year, and type

#### Scenario: An adaptation has a poster path
- **WHEN** an adaptation in the list has a TMDb poster path
- **THEN** its list item shows a poster thumbnail image built from that path

#### Scenario: An adaptation has no poster path
- **WHEN** an adaptation in the list has no TMDb poster path
- **THEN** its list item shows a generic placeholder image in place of a poster thumbnail

### Requirement: Adaptations list is sortable by title and release year
The system SHALL allow a visitor to sort the adaptations list by title or by release year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the adaptations list by title
- **THEN** the list items are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by release year
- **WHEN** a visitor chooses to sort the adaptations list by release year
- **THEN** the list items are ordered by release year, and choosing the same sort again reverses the order

### Requirement: Adaptations list is searchable by title
The system SHALL allow a visitor to enter search text that filters the adaptations list to only items whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the list shows only adaptations whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the list shows every adaptation in the canonical list again

### Requirement: Adaptations list is filterable by type
The system SHALL allow a visitor to filter the adaptations list by type, choosing from a dropdown listing every distinct type present among the canonical adaptations, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical adaptations, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the list shows only adaptations whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the list shows adaptations of every type again

### Requirement: Adaptations list filters and search combine
The system SHALL apply the title search and the type filter together, showing only adaptations that satisfy both active constraints at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only adaptations that match the search term and the selected type

### Requirement: Adaptations list poster images load lazily and fail gracefully
The system SHALL lazy-load poster thumbnails in the adaptations list and SHALL fall back to the generic placeholder image if a poster image fails to load.

#### Scenario: A poster image fails to load
- **WHEN** an adaptation's poster thumbnail image cannot be retrieved from its image source
- **THEN** the list shows the generic placeholder image for that item instead of a broken image

## ADDED Requirements

### Requirement: Adaptations list item reserves space for action buttons
Each adaptations list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the release year and type at the leading edge. This change does not populate the actions area with any functional buttons.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views an adaptation's list item
- **THEN** the metadata row shows the release year and type grouped at the leading edge and an empty actions area reserved at the trailing edge
