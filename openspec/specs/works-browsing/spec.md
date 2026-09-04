# works-browsing Specification

## Purpose

Gives visitors a page to browse the full canonical King bibliography as a sortable, searchable, filterable table.

## Requirements

### Requirement: Works page lists all canonical King works
The system SHALL provide a page that displays every King work from the canonical bibliography as a vertically stacked list, where each list item is laid out horizontally, showing a cover thumbnail on the left and, to its right, the title above a metadata row. The metadata row groups the original publish year and type at its leading edge, justified against an actions area reserved at its trailing edge.

#### Scenario: Visiting the works page
- **WHEN** a visitor navigates to the works page
- **THEN** the page displays a list item for every King work in the canonical bibliography, showing its cover thumbnail, title, original publish year, and type

#### Scenario: A work has a cover identifier
- **WHEN** a King work in the list has an Open Library cover identifier
- **THEN** its list item shows a cover thumbnail image built from that identifier

#### Scenario: A work has no cover identifier
- **WHEN** a King work in the list has no Open Library cover identifier
- **THEN** its list item shows a generic placeholder image in place of a cover thumbnail

### Requirement: Works list is sortable by title and release year
The system SHALL allow a visitor to sort the works list by title or by original publish year, in ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor chooses to sort the works list by title
- **THEN** the list items are ordered alphabetically by title, and choosing the same sort again reverses the order

#### Scenario: Sorting by release year
- **WHEN** a visitor chooses to sort the works list by release year
- **THEN** the list items are ordered by original publish year, and choosing the same sort again reverses the order

### Requirement: Works list is searchable by title
The system SHALL allow a visitor to enter search text that filters the works list to only items whose title matches the search text.

#### Scenario: Searching narrows the results
- **WHEN** a visitor enters text into the search input
- **THEN** the list shows only King works whose title contains the entered text

#### Scenario: Clearing the search restores all results
- **WHEN** a visitor clears the search input
- **THEN** the list shows every King work in the canonical bibliography again

### Requirement: Works list is filterable by Bachman and Dark Tower flags
The system SHALL allow a visitor to filter the works list by a single flag selector choosing between "All", "Bachman", and "Dark Tower". Selecting "Bachman" restricts the visible items to works whose Bachman flag is true; selecting "Dark Tower" restricts the visible items to works whose Dark Tower flag is true; selecting "All" applies no restriction based on either flag. Only one option is active at a time, so Bachman and Dark Tower cannot be filtered for simultaneously.

#### Scenario: Filtering to Bachman works
- **WHEN** a visitor selects "Bachman" in the flag filter
- **THEN** the list shows only King works whose Bachman flag is true

#### Scenario: Filtering to Dark Tower works
- **WHEN** a visitor selects "Dark Tower" in the flag filter
- **THEN** the list shows only King works whose Dark Tower flag is true

#### Scenario: Clearing the flag filter
- **WHEN** a visitor selects "All" in the flag filter
- **THEN** the list shows King works regardless of their Bachman or Dark Tower flag, subject to any other active search or filters

### Requirement: Works list is filterable by type
The system SHALL allow a visitor to filter the works list by work type, choosing from a dropdown listing every distinct type present among the canonical King works, plus an option to show all types.

#### Scenario: Type dropdown lists available types
- **WHEN** a visitor opens the type filter dropdown
- **THEN** it lists every distinct type value present among the canonical King works, plus an option to show all types

#### Scenario: Filtering to a single type
- **WHEN** a visitor selects a specific type from the type filter dropdown
- **THEN** the list shows only King works whose type matches the selected type

#### Scenario: Clearing the type filter
- **WHEN** a visitor selects the "all types" option in the type filter dropdown
- **THEN** the list shows King works of every type again, subject to any other active search or filters

### Requirement: Works list filters and search combine
The system SHALL apply the title search, the flag filter, and the type filter together, showing only works that satisfy every active constraint at once.

#### Scenario: Combining search, flag filter, and type filter
- **WHEN** a visitor has a search term, a flag filter selection other than "All", and a type filter active
- **THEN** the list shows only King works that match the search term, the selected flag, and the selected type at once

### Requirement: Works list cover images load lazily and fail gracefully
The system SHALL lazy-load cover thumbnails in the works list and SHALL fall back to the generic placeholder image if a cover image fails to load.

#### Scenario: A cover image fails to load
- **WHEN** a work's cover thumbnail image cannot be retrieved from its image source
- **THEN** the list shows the generic placeholder image for that item instead of a broken image

### Requirement: Works list item reserves space for action buttons
Each works list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the release year and type at the leading edge. For a signed-in user, this area SHALL show a single split button reflecting that work's current reading status for that user: a primary segment whose action depends on state, and a secondary chevron segment opening a dropdown menu of the state's other applicable actions. For a signed-out visitor, the actions area SHALL remain empty.

The primary action is "Mark as Read" when the work is not want-to-read, not currently-reading, and not read; "Start Reading" when the work is want-to-read; "Finish" when the work is currently-reading; and "Mark as Not Read" when the work is read.

The dropdown lists whichever of Want to Read, Start Reading, Finish, Mark as Read, and Mark as Not Read is not the current primary action and would have an actual effect, omitting any action the underlying data rules would silently ignore.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views a work's list item
- **THEN** the metadata row shows the release year and type grouped at the leading edge and an actions area reserved at the trailing edge

#### Scenario: Viewing a list item's metadata row as a signed-out visitor
- **WHEN** a signed-out visitor views a work's list item
- **THEN** the actions area is empty

#### Scenario: Neutral work shows Mark as Read as the primary action
- **WHEN** a signed-in user views a work that is not want-to-read, not currently-reading, and not read
- **THEN** the split button's primary action is "Mark as Read", and its dropdown offers Want to Read and Start Reading

#### Scenario: Want-to-read work shows Start Reading as the primary action
- **WHEN** a signed-in user views a work that is want-to-read
- **THEN** the split button's primary action is "Start Reading", and its dropdown offers removing Want to Read and Mark as Read

#### Scenario: Currently-reading work shows Finish as the primary action
- **WHEN** a signed-in user views a work that is currently-reading
- **THEN** the split button's primary action is "Finish", and its dropdown offers Mark as Read

#### Scenario: Read work shows Mark as Not Read as the primary action
- **WHEN** a signed-in user views a work that is read
- **THEN** the split button's primary action is "Mark as Not Read", and its dropdown has no other applicable actions
