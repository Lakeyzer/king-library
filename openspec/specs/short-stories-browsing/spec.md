# short-stories-browsing Specification

## Purpose

Gives visitors a page to browse the canonical short story bibliography as a searchable, sortable, filterable table, mirroring how `/works` lets visitors browse full-length works.

## Requirements

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

### Requirement: Short stories list is filterable by read status for signed-in users
The system SHALL show a signed-in user a read-status filter on the short works page, choosing between "All", "Read", and "Unread". Selecting "Read" restricts the visible items to short stories the user has marked read; selecting "Unread" restricts the visible items to short stories the user has not marked read; selecting "All" applies no restriction based on read status. The filter SHALL default to "All" each time the page loads. The system SHALL NOT show the read-status filter to a signed-out visitor, and SHALL NOT apply any read-status restriction for a signed-out visitor.

#### Scenario: Filtering to read short stories
- **WHEN** a signed-in user selects "Read" in the read-status filter
- **THEN** the list shows only short stories the user has marked read

#### Scenario: Filtering to unread short stories
- **WHEN** a signed-in user selects "Unread" in the read-status filter
- **THEN** the list shows only short stories the user has not marked read

#### Scenario: Clearing the read-status filter
- **WHEN** a signed-in user selects "All" in the read-status filter
- **THEN** the list shows short stories regardless of read status, subject to any other active search or filters

#### Scenario: Read-status filter defaults to All
- **WHEN** a signed-in user loads the short works page
- **THEN** the read-status filter is set to "All" and no short story is hidden because of its read status

#### Scenario: Marking a short story read while filtering to unread
- **WHEN** a signed-in user has "Unread" selected and marks a listed short story read
- **THEN** that short story leaves the list, since it no longer matches the active filter

#### Scenario: Signed-out visitor sees no read-status filter
- **WHEN** a signed-out visitor views the short works page
- **THEN** no read-status filter is shown and the list is not restricted by read status

### Requirement: Short stories list filters and search combine
The system SHALL apply the title search, the type filter, the "Not in a collection" filter, and (for a signed-in user) the read-status filter together, showing only short stories that satisfy every active constraint at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only short stories that match the search term and the selected type

#### Scenario: Combining the read-status filter with other filters
- **WHEN** a signed-in user has a search term, a type filter, "Not in a collection" checked, and a read-status selection other than "All" active
- **THEN** the list shows only short stories that match the search term and the selected type, appear in no collection, and match the selected read status, all at once

### Requirement: Short stories list item reserves space for action buttons
Each short stories list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the original publish year and type at the leading edge. This change does not populate the actions area with any functional buttons.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views a short story's list item
- **THEN** the metadata row shows the original publish year and type grouped at the leading edge and an empty actions area reserved at the trailing edge

### Requirement: Room 217 search reveals a hidden message
When a visitor's search text on the short stories page is exactly "217" (ignoring leading/trailing whitespace) and it matches no short story, the system SHALL show a message reading "You weren't supposed to find this." in place of the normal empty-search-results state, referencing *The Shining*'s Room 217.

#### Scenario: Searching 217 with no matches
- **WHEN** a visitor enters "217" into the short stories search input and no short story title matches it
- **THEN** the list area shows "You weren't supposed to find this." instead of the normal empty-search-results state

#### Scenario: 217 happens to match a short story
- **WHEN** a visitor enters "217" into the short stories search input and it matches one or more short story titles
- **THEN** the list shows those matching short stories as normal, without the hidden message
