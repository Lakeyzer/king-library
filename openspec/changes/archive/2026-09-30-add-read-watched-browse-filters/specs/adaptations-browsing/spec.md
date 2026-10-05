## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Adaptations list filters and search combine
The system SHALL apply the title search, the type filter, and (for a signed-in user) the watched-status filter together, showing only adaptations that satisfy every active constraint at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only adaptations that match the search term and the selected type

#### Scenario: Combining the watched-status filter with other filters
- **WHEN** a signed-in user has a search term, a type filter, and a watched-status selection other than "All" active
- **THEN** the list shows only adaptations that match the search term, the selected type, and the selected watched status at once
