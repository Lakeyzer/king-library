## Purpose

Gives visitors a page to browse the canonical list of King screen adaptations as a searchable, sortable, filterable table, mirroring how `/works` lets visitors browse full-length works.

## ADDED Requirements

### Requirement: Adaptations page lists all canonical adaptations
The system SHALL provide a page that displays every adaptation from the canonical list in a table, showing each adaptation's title, release year, and type.

#### Scenario: Visiting the adaptations page
- **WHEN** a visitor navigates to the adaptations page
- **THEN** the page displays a table row for every adaptation in the canonical list, showing its title, release year, and type

### Requirement: Adaptations table is sortable by title and release year
The system SHALL allow a visitor to sort the adaptations table by title or by release year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the adaptations table by title
- **THEN** the table rows are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by release year
- **WHEN** a visitor chooses to sort the adaptations table by release year
- **THEN** the table rows are ordered by release year, and choosing the same sort again reverses the order

### Requirement: Adaptations table is searchable by title
The system SHALL allow a visitor to enter search text that filters the adaptations table to only rows whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the table shows only adaptations whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the table shows every adaptation in the canonical list again

### Requirement: Adaptations table is filterable by type
The system SHALL allow a visitor to filter the adaptations table by type, choosing from a dropdown listing every distinct type present among the canonical adaptations, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical adaptations, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the table shows only adaptations whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the table shows adaptations of every type again

### Requirement: Adaptations table filters and search combine
The system SHALL apply the title search and the type filter together, showing only adaptations that satisfy both active constraints at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the table shows only adaptations that match the search term and the selected type
