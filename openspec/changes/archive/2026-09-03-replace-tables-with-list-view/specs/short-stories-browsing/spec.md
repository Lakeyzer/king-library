## MODIFIED Requirements

### Requirement: Short stories page lists all canonical short stories
The system SHALL provide a page that displays every King short story from the canonical bibliography as a vertically stacked list, where each list item is laid out horizontally, showing a placeholder image on the left (short stories have no cover image data source) and, to its right, the title above a metadata row. The metadata row groups the original publish year and type at its leading edge, justified against an actions area reserved at its trailing edge.

#### Scenario: Visiting the short stories page
- **WHEN** a visitor navigates to the short stories page
- **THEN** the page displays a list item for every short story in the canonical bibliography, showing its placeholder image, title, original publish year, and type

### Requirement: Short stories list is sortable by title and original publish year
The system SHALL allow a visitor to sort the short stories list by title or by original publish year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the short stories list by title
- **THEN** the list items are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by original publish year
- **WHEN** a visitor chooses to sort the short stories list by original publish year
- **THEN** the list items are ordered by original publish year, and choosing the same sort again reverses the order

### Requirement: Short stories list is searchable by title
The system SHALL allow a visitor to enter search text that filters the short stories list to only items whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the list shows only short stories whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the list shows every short story in the canonical bibliography again

### Requirement: Short stories list is filterable by type
The system SHALL allow a visitor to filter the short stories list by type, choosing from a dropdown listing every distinct type present among the canonical short stories, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical short stories, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the list shows only short stories whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the list shows short stories of every type again

### Requirement: Short stories list filters and search combine
The system SHALL apply the title search and the type filter together, showing only short stories that satisfy both active constraints at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only short stories that match the search term and the selected type

## ADDED Requirements

### Requirement: Short stories list item reserves space for action buttons
Each short stories list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the original publish year and type at the leading edge. This change does not populate the actions area with any functional buttons.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views a short story's list item
- **THEN** the metadata row shows the original publish year and type grouped at the leading edge and an empty actions area reserved at the trailing edge
