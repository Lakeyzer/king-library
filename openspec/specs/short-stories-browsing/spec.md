# short-stories-browsing Specification

## Purpose

Gives visitors a page to browse the canonical short story bibliography as a searchable, sortable, filterable table, mirroring how `/works` lets visitors browse full-length works.

## Requirements

### Requirement: Short stories page lists all canonical short stories
The system SHALL provide a page that displays every King short story from the canonical bibliography in a table, showing each story's title, original publish year, type, and Dark Tower flag.

#### Scenario: Visiting the short stories page
- **WHEN** a visitor navigates to the short stories page
- **THEN** the page displays a table row for every short story in the canonical bibliography, showing its title, original publish year, type, and Dark Tower flag

### Requirement: Short stories table is sortable by title and original publish year
The system SHALL allow a visitor to sort the short stories table by title or by original publish year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the short stories table by title
- **THEN** the table rows are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by original publish year
- **WHEN** a visitor chooses to sort the short stories table by original publish year
- **THEN** the table rows are ordered by original publish year, and choosing the same sort again reverses the order

### Requirement: Short stories table is searchable by title
The system SHALL allow a visitor to enter search text that filters the short stories table to only rows whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the table shows only short stories whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the table shows every short story in the canonical bibliography again

### Requirement: Short stories table is filterable by type
The system SHALL allow a visitor to filter the short stories table by type, choosing from a dropdown listing every distinct type present among the canonical short stories, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical short stories, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the table shows only short stories whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the table shows short stories of every type again

### Requirement: Short stories table filters and search combine
The system SHALL apply the title search and the type filter together, showing only short stories that satisfy both active constraints at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the table shows only short stories that match the search term and the selected type
