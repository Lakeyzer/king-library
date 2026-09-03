# works-browsing Specification

## Purpose

Gives visitors a page to browse the full canonical King bibliography as a sortable, searchable, filterable table.

## Requirements

### Requirement: Works page lists all canonical King works
The system SHALL provide a page that displays every King work from the canonical bibliography in a table, showing each work's title, original publish year, type, Bachman flag, Dark Tower flag, and a cover thumbnail.

#### Scenario: Visiting the works page
- **WHEN** a visitor navigates to the works page
- **THEN** the page displays a table row for every King work in the canonical bibliography, showing its title, original publish year, type, Bachman flag, Dark Tower flag, and a cover thumbnail

#### Scenario: A work has a cover identifier
- **WHEN** a King work in the table has an Open Library cover identifier
- **THEN** its row shows a cover thumbnail image built from that identifier

#### Scenario: A work has no cover identifier
- **WHEN** a King work in the table has no Open Library cover identifier
- **THEN** its row shows a generic placeholder image in place of a cover thumbnail

### Requirement: Works table is sortable by title and release year
The system SHALL allow a visitor to sort the works table by title or by original publish year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the works table by title
- **THEN** the table rows are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by release year
- **WHEN** a visitor chooses to sort the works table by release year
- **THEN** the table rows are ordered by original publish year, and choosing the same sort again reverses the order

### Requirement: Works table is searchable by title
The system SHALL allow a visitor to enter search text that filters the works table to only rows whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the table shows only King works whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the table shows every King work in the canonical bibliography again

### Requirement: Works table is filterable by Bachman and Dark Tower flags
The system SHALL allow a visitor to filter the works table independently by the Bachman flag and by the Dark Tower flag, each via a checkbox that, when checked, restricts the visible rows to works whose corresponding flag is true, and when unchecked, applies no restriction based on that flag.

#### Scenario: Filtering to Bachman works
- **WHEN** a visitor checks the Bachman filter checkbox
- **THEN** the table shows only King works whose Bachman flag is true

#### Scenario: Clearing the Bachman filter
- **WHEN** a visitor unchecks the Bachman filter checkbox
- **THEN** the table shows King works regardless of their Bachman flag, subject to any other active search or filters

#### Scenario: Filtering to Dark Tower works
- **WHEN** a visitor checks the Dark Tower filter checkbox
- **THEN** the table shows only King works whose Dark Tower flag is true

#### Scenario: Clearing the Dark Tower filter
- **WHEN** a visitor unchecks the Dark Tower filter checkbox
- **THEN** the table shows King works regardless of their Dark Tower flag, subject to any other active search or filters

### Requirement: Works table is filterable by type
The system SHALL allow a visitor to filter the works table by work type, choosing from a dropdown listing every distinct type present among the canonical King works, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical King works, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the table shows only King works whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the table shows King works of every type again, subject to any other active search or filters

### Requirement: Works table filters and search combine
The system SHALL apply the title search, the Bachman filter, the Dark Tower filter, and the type filter together, showing only works that satisfy every active constraint at once.

#### Scenario: Combining search, flag filters, and type filter
- **WHEN** a visitor has a search term and any combination of the Bachman filter, Dark Tower filter, and type filter active
- **THEN** the table shows only King works that match the search term and every active filter at once

### Requirement: Works table cover images load lazily and fail gracefully
The system SHALL lazy-load cover thumbnails in the works table and SHALL fall back to the generic placeholder image if a cover image fails to load.

#### Scenario: A cover image fails to load
- **WHEN** a work's cover thumbnail image cannot be retrieved from its image source
- **THEN** the table shows the generic placeholder image for that row instead of a broken image
