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
The system SHALL persist, for each work that belongs to a series, the series it belongs to and its position (reading order) within that series. A series member MAY be a King work or a By Other Hands work, so a series can include a book King did not write (e.g. Gwendy's Magic Feather in the Gwendy's Trilogy). A work MAY belong to zero, one, or more series. No two works in the same series SHALL share the same position.

#### Scenario: A work's series membership has the expected fields
- **WHEN** a work is recorded as a member of a series
- **THEN** the membership records the series, the work, and a position

#### Scenario: A By Other Hands work is a series member
- **WHEN** a By Other Hands work is recorded as a member of a series
- **THEN** the membership is stored and returned exactly like a King work's membership

#### Scenario: A work with no series membership
- **WHEN** a work belongs to no series
- **THEN** it has no series membership records

#### Scenario: No two works share a position within one series
- **WHEN** a work is recorded as a member of a series
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
The system SHALL provide a way for application code to fetch every series along with its member works ordered by position, for use by series-aware display features. Series SHALL be returned in a fixed display order: Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy. A series without a place in that order SHALL come after them, in alphabetical order of name.

#### Scenario: Fetching all series
- **WHEN** application code requests all series
- **THEN** it receives every series currently in storage, in the display order above, each with its member works ordered by position

### Requirement: Seed data reflects the canonical series
The system's series data SHALL include exactly these five series, each with its members in the reading order given:
- "Bachman Books": Rage, The Long Walk, Roadwork, The Running Man, Thinner, The Regulators, Blaze, The Bachman Books
- "Dark Tower": The Gunslinger (Revised Edition), The Drawing of the Three, The Waste Lands, Wizard and Glass, The Wind Through the Keyhole, Wolves of the Calla, Song of Susannah, The Dark Tower
- "Gwendy's Trilogy": Gwendy's Button Box, Gwendy's Magic Feather, Gwendy's Final Task
- "Hodges & Holly": Mr. Mercedes, Finders Keepers, End of Watch, The Outsider, If It Bleeds, Holly, Never Flinch
- "Talisman": The Talisman, Black House, Other Worlds Than These

The Bachman Books omnibus SHALL be a member of the "Bachman Books" series, placed after the novels. As an omnibus, it never counts toward that series' reading progress (see "Per-series reading progress for a user").

#### Scenario: The omnibus is listed but not counted
- **WHEN** a user's Bachman Books series progress is computed
- **THEN** the total is 7 (the novels), not 8, even though The Bachman Books omnibus is a member of the series

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical series data is loaded into the system
- **THEN** the list includes exactly the Bachman Books, Dark Tower, Gwendy's Trilogy, Hodges & Holly, and Talisman series, each with its member works in the reading order given above

#### Scenario: The former Hodges trilogy keeps its identity under its new name
- **WHEN** the series data is loaded into a database that already holds the "Mercedes Killer" series
- **THEN** that same series is renamed "Hodges & Holly" and gains The Outsider, If It Bleeds, Holly, and Never Flinch, rather than a second series being created alongside it

### Requirement: Per-series reading progress for a user
The system SHALL provide, for any user, a reading-progress figure for every series: the number of that series' counted members the user has marked read, out of the number of counted members. A counted member is an active work in the series, of either kind (King or By Other Hands), that is not an omnibus. Two works linked as alternate texts of the same book (e.g. the original Gunslinger and its Revised Edition) SHALL share one slot: reading either one satisfies that slot, and only the series member itself adds to the total. Progress SHALL be computed per series independently, so a work in two series counts toward both.

#### Scenario: Progress counts read members out of all counted members
- **WHEN** a user has read 2 of the 3 active members of a series
- **THEN** that series' progress is 2 out of 3

#### Scenario: A By Other Hands member counts toward progress
- **WHEN** a user has read Gwendy's Magic Feather and no other Gwendy book
- **THEN** the Gwendy's Trilogy progress is 1 out of 3

#### Scenario: Reading the alternate text satisfies the member's slot
- **WHEN** a user has read the original Gunslinger but not its Revised Edition (the Dark Tower series member)
- **THEN** the Dark Tower series progress counts that slot as read, and its total is unchanged by the alternate's existence

#### Scenario: An inactive member is excluded
- **WHEN** a series member is marked inactive
- **THEN** it no longer contributes to that series' read count or total

#### Scenario: A user who has read nothing in a series
- **WHEN** a user has read none of a series' members
- **THEN** that series' progress is 0 out of its counted-member total
