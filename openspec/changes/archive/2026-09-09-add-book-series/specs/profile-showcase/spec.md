## MODIFIED Requirements

### Requirement: Bookshelf can be sorted by title or release year
The system SHALL let a visitor sort the Bookshelf's tiles by the owning King work's title or its release year, in either ascending or descending order. When series grouping is enabled, this sort determines the order of series (as units) and standalone tiles relative to each other, but not the order of tiles within a grouped series — see "Grouped series tiles keep their series reading order."

#### Scenario: Sorting by title
- **WHEN** a visitor sorts the Bookshelf by title
- **THEN** tiles are ordered alphabetically by their King work's title

#### Scenario: Sorting by release year
- **WHEN** a visitor sorts the Bookshelf by release year
- **THEN** tiles are ordered by their King work's release year

#### Scenario: Reversing sort direction
- **WHEN** a visitor toggles the Bookshelf's sort direction
- **THEN** the tile order reverses

## ADDED Requirements

### Requirement: Bookshelf can be grouped by series
The system SHALL show a "Group series" checkbox among the Bookshelf's controls, shown whenever the collection is non-empty, unchecked by default, which lets a visitor toggle whether tiles belonging to the same series are grouped together.

#### Scenario: Grouping is off by default
- **WHEN** a visitor first views a Bookshelf
- **THEN** the "Group series" checkbox is unchecked and tiles are not grouped by series

#### Scenario: Enabling grouping
- **WHEN** a visitor checks "Group series"
- **THEN** tiles belonging to the same series are grouped together in the Bookshelf grid

#### Scenario: Disabling grouping
- **WHEN** a visitor unchecks "Group series" after enabling it
- **THEN** tiles return to their ungrouped order and column placement

### Requirement: Grouped series tiles keep their series reading order
The system SHALL, when series grouping is enabled, order the tiles of a grouped series by that series' reading-order position rather than by the Bookshelf's active sort field, using only the series' member works that are present in the collection.

#### Scenario: Sorting by title with grouping enabled
- **WHEN** a visitor sorts the Bookshelf by title with "Group series" checked
- **THEN** tiles within a grouped series appear in series reading order rather than alphabetically

#### Scenario: Sorting by release year with grouping enabled
- **WHEN** a visitor sorts the Bookshelf by release year with "Group series" checked
- **THEN** tiles within a grouped series appear in series reading order rather than by release year

#### Scenario: Only some of a series' works are in the collection
- **WHEN** a profile owner's collection contains some, but not all, of a series' member works, and grouping is enabled
- **THEN** the series group contains only the works present in the collection, ordered by their series reading order

### Requirement: Grouping leaves standalone tiles individually sorted
The system SHALL, when series grouping is enabled, continue to order tiles for King works that belong to no series individually by the Bookshelf's active sort field, rather than treating them as part of any group.

#### Scenario: Mixed collection with grouping enabled
- **WHEN** a profile owner's collection includes both series and standalone works and "Group series" is checked
- **THEN** standalone tiles are ordered individually by the active sort field while series tiles cluster together

### Requirement: A grouped series flows contiguously through the masonry grid
The system SHALL, when series grouping is enabled, place a grouped series' tiles at consecutive positions in the Bookshelf's tile ordering, assigned to columns by the same left-to-right, wrap-to-next-row placement used when ungrouped, rather than confining the series to a single column.

#### Scenario: A grouped series with more members than columns
- **WHEN** a series has more tiles in the collection than the Bookshelf's current column count, and grouping is enabled
- **THEN** that series' tiles fill across columns left to right and continue on the next row, in the same left-to-right, wrapping placement as any other run of consecutive tiles, rather than stacking within one column

#### Scenario: Grouping disabled restores independent column assignment
- **WHEN** a visitor unchecks "Group series"
- **THEN** tiles are assigned to columns independently of series membership, as in the ungrouped behavior

### Requirement: Grouping applies after the active search filter
The system SHALL, when series grouping is enabled, apply grouping only to the tiles remaining after the Bookshelf's search filter, so a series with only some members matching the search groups only those matching tiles.

#### Scenario: Search narrows a grouped series to one match
- **WHEN** a visitor's search term matches only one work in a series that has multiple works in the collection, and "Group series" is checked
- **THEN** the Bookshelf shows only the matching tile, without the rest of that series
