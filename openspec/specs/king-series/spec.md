# king-series Specification

## Purpose

Defines a canonical list of King work series (e.g. the Dark Tower, the Bill Hodges trilogy, the Talisman duology) and each series' member works in reading order, as a source of truth series-aware features can group a user's collection by.

## Requirements

### Requirement: Canonical series storage
The system SHALL persist a canonical list of series, each with a name and a unique identifier, independent of the existing `dark_tower` flag on King works.

#### Scenario: A series has the expected fields
- **WHEN** a series is stored in the canonical list
- **THEN** it has a name and a unique identifier

#### Scenario: No two series share a name
- **WHEN** a series is stored in the canonical list
- **THEN** its name is unique among all series' names

### Requirement: Series membership with reading order
The system SHALL persist, for each King work that belongs to a series, the series it belongs to and its position (reading order) within that series. A King work MAY belong to zero, one, or more series. No two works in the same series SHALL share the same position.

#### Scenario: A work's series membership has the expected fields
- **WHEN** a King work is recorded as a member of a series
- **THEN** the membership records the series, the work, and a position

#### Scenario: A work with no series membership
- **WHEN** a King work belongs to no series
- **THEN** it has no series membership records

#### Scenario: No two works share a position within one series
- **WHEN** a King work is recorded as a member of a series
- **THEN** its position is unique among that series' other members' positions

### Requirement: Public read access to series and membership
Anyone, including unauthenticated visitors, SHALL be able to read the full list of series and each series' member works with their positions.

#### Scenario: Anonymous visitor reads series data
- **WHEN** an unauthenticated visitor requests the list of series
- **THEN** the system returns all series and their member works in position order

#### Scenario: Authenticated user reads series data
- **WHEN** an authenticated user requests the list of series
- **THEN** the system returns all series and their member works in position order

### Requirement: No client-side writes to series data
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete series or series membership through the application.

#### Scenario: Authenticated user attempts to write
- **WHEN** an authenticated user's client attempts to insert, update, or delete a series or a series membership record
- **THEN** the system rejects the operation

#### Scenario: Anonymous visitor attempts to write
- **WHEN** an unauthenticated visitor's client attempts to insert, update, or delete a series or a series membership record
- **THEN** the system rejects the operation

### Requirement: Retrieve a King work's series membership
The system SHALL provide a way for application code to look up which series (if any) a given King work belongs to and its position within that series, or to determine that the work belongs to no series.

#### Scenario: Looking up a work that belongs to a series
- **WHEN** application code requests series membership for a King work that belongs to a series
- **THEN** it receives that series' identifier, name, and the work's position within it

#### Scenario: Looking up a work that belongs to no series
- **WHEN** application code requests series membership for a King work that belongs to no series
- **THEN** it receives an indication that the work has no series membership

### Requirement: Retrieve all series with ordered member works for display
The system SHALL provide a way for application code to fetch every series along with its member works ordered by position, for use by series-aware display features.

#### Scenario: Fetching all series
- **WHEN** application code requests all series
- **THEN** it receives every series currently in storage, each with its member works ordered by position

### Requirement: Seed data reflects the three canonical series
The system's initial series data SHALL include exactly three series: "Dark Tower" with members The Gunslinger, The Drawing of the Three, The Waste Lands, Wizard and Glass, The Wind Through the Keyhole, Wolves of the Calla, Song of Susannah, and The Dark Tower, in that reading order; "Mercedes Killer" (the Bill Hodges trilogy) with members Mr. Mercedes, Finders Keepers, and End of Watch, in that reading order; and "Talisman" with members The Talisman and Black House, in that reading order.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical series data is loaded into the system
- **THEN** the list includes exactly the Dark Tower, Mercedes Killer, and Talisman series, each with its member works in the reading order given above
