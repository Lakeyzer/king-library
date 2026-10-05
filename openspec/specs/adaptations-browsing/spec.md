# adaptations-browsing Specification

## Purpose

Gives visitors a page to browse the canonical list of King screen adaptations as a searchable, sortable, filterable table, mirroring how `/works` lets visitors browse full-length works.

## Requirements

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

### Requirement: Adaptations list is filterable by watched status for signed-in users
The system SHALL show a signed-in user a watched-status filter on the adaptations page, choosing between "All", "Watched", and "Unwatched". Selecting "Watched" restricts the visible items to adaptations the user has marked watched; selecting "Unwatched" restricts the visible items to adaptations the user has not marked watched (including adaptations on their watchlist); selecting "All" applies no restriction based on watched status. The filter SHALL default to "All" each time the page loads. The system SHALL NOT show the watched-status filter to a signed-out visitor, and SHALL NOT apply any watched-status restriction for a signed-out visitor.

#### Scenario: Filtering to watched adaptations
- **WHEN** a signed-in user selects "Watched" in the watched-status filter
- **THEN** the list shows only adaptations the user has marked watched

#### Scenario: Filtering to unwatched adaptations
- **WHEN** a signed-in user selects "Unwatched" in the watched-status filter
- **THEN** the list shows only adaptations the user has not marked watched, including adaptations on their watchlist

#### Scenario: Clearing the watched-status filter
- **WHEN** a signed-in user selects "All" in the watched-status filter
- **THEN** the list shows adaptations regardless of watched status, subject to any other active search or filters

#### Scenario: Watched-status filter defaults to All
- **WHEN** a signed-in user loads the adaptations page
- **THEN** the watched-status filter is set to "All" and no adaptation is hidden because of its watched status

#### Scenario: Marking an adaptation watched while filtering to unwatched
- **WHEN** a signed-in user has "Unwatched" selected and marks a listed adaptation watched
- **THEN** that adaptation leaves the list, since it no longer matches the active filter

#### Scenario: Signed-out visitor sees no watched-status filter
- **WHEN** a signed-out visitor views the adaptations page
- **THEN** no watched-status filter is shown and the list is not restricted by watched status

### Requirement: Adaptations list filters and search combine
The system SHALL apply the title search, the type filter, and (for a signed-in user) the watched-status filter together, showing only adaptations that satisfy every active constraint at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only adaptations that match the search term and the selected type

#### Scenario: Combining the watched-status filter with other filters
- **WHEN** a signed-in user has a search term, a type filter, and a watched-status selection other than "All" active
- **THEN** the list shows only adaptations that match the search term, the selected type, and the selected watched status at once

### Requirement: Adaptations list poster images load lazily and fail gracefully
The system SHALL lazy-load poster thumbnails in the adaptations list and SHALL fall back to the generic placeholder image if a poster image fails to load.

#### Scenario: A poster image fails to load
- **WHEN** an adaptation's poster thumbnail image cannot be retrieved from its image source
- **THEN** the list shows the generic placeholder image for that item instead of a broken image

### Requirement: Adaptations list item reserves space for action buttons
Each adaptations list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the release year and type at the leading edge. This change does not populate the actions area with any functional buttons.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views an adaptation's list item
- **THEN** the metadata row shows the release year and type grouped at the leading edge and an empty actions area reserved at the trailing edge

### Requirement: Room 217 search reveals a hidden message
When a visitor's search text on the adaptations page is exactly "217" (ignoring leading/trailing whitespace) and it matches no adaptation, the system SHALL show a message reading "You weren't supposed to find this." in place of the normal empty-search-results state, referencing *The Shining*'s Room 217.

#### Scenario: Searching 217 with no matches
- **WHEN** a visitor enters "217" into the adaptations search input and no adaptation title matches it
- **THEN** the list area shows "You weren't supposed to find this." instead of the normal empty-search-results state

#### Scenario: 217 happens to match an adaptation
- **WHEN** a visitor enters "217" into the adaptations search input and it matches one or more adaptation titles
- **THEN** the list shows those matching adaptations as normal, without the hidden message
