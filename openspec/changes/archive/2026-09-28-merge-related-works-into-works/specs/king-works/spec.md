## ADDED Requirements

### Requirement: Every work is labelled King or related
The system SHALL store King works and By Other Hands works as rows of one canonical works list. Each work SHALL carry exactly one label: `king` for a work from the canonical Stephen King bibliography, or `related` for a By Other Hands work. The label decides which pages, lists, and statistics a work appears in. Related-only details (creator, category, connection note) SHALL be present only on related works.

#### Scenario: A King work is labelled king
- **WHEN** a work from the canonical Stephen King bibliography is stored
- **THEN** its label is `king`

#### Scenario: A By Other Hands work is labelled related
- **WHEN** a By Other Hands work is stored
- **THEN** its label is `related`, and it has a creator and a category

#### Scenario: A work cannot carry both labels or none
- **WHEN** a work is stored without a label, or with a label other than `king` or `related`
- **THEN** the system rejects it

#### Scenario: Slugs are unique across both labels
- **WHEN** a work is stored
- **THEN** its slug is unique among all works, King and related alike

## MODIFIED Requirements

### Requirement: Retrieve a single King work by slug
The system SHALL provide a way for application code to fetch a single active King work by its slug, including the same fields returned when fetching the full list, or to determine that no active King work matches that slug. An inactive work, or a work labelled `related`, SHALL be treated the same as no match.

#### Scenario: Fetching a work that exists
- **WHEN** application code requests a King work by a slug that matches an existing King work
- **THEN** it receives that work's stored fields

#### Scenario: Fetching a work that does not exist
- **WHEN** application code requests a King work by a slug that matches no existing work
- **THEN** it receives an indication that no work matches

#### Scenario: Fetching a work that exists but is inactive
- **WHEN** application code requests a King work by a slug that matches an existing work whose active flag is false
- **THEN** it receives the same indication as if no work matched

#### Scenario: Fetching a related work's slug as a King work
- **WHEN** application code requests a King work by a slug that belongs to a work labelled `related`
- **THEN** it receives the same indication as if no work matched

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of active King works for display, including each work's title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note. Inactive works and works labelled `related` SHALL be excluded from this list.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works for display
- **THEN** it receives every active King work currently in storage, including title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note

#### Scenario: An inactive work is excluded
- **WHEN** application code requests all King works for display and one or more King works have an active flag of false
- **THEN** those inactive works are not included in the results

#### Scenario: Related works are excluded
- **WHEN** application code requests all King works for display
- **THEN** no work labelled `related` is included in the results

### Requirement: Shuffle position is unique and densely assigned
The system SHALL assign every King work a unique shuffle position, with the full set of shuffle positions across all King works forming a contiguous range with no gaps and no two works sharing the same value. Works labelled `related` SHALL have no shuffle position, so they never take part in the Book of the week rotation and never leave gaps in the King range.

#### Scenario: No two works share a shuffle position
- **WHEN** a King work is stored in the canonical list
- **THEN** its shuffle position is unique among all King works' shuffle positions

#### Scenario: Shuffle positions have no gaps
- **WHEN** the full set of King works' shuffle positions is examined
- **THEN** it forms a contiguous range with no skipped values

#### Scenario: A related work has no shuffle position
- **WHEN** a work labelled `related` is stored
- **THEN** it has no shuffle position

### Requirement: New King works are auto-assigned the next available shuffle position
The system SHALL automatically assign a newly added King work the next available shuffle position (one past the current highest assigned value among King works) when no shuffle position is explicitly supplied, so adding a new book to the canonical list requires no manual update to any rotation schedule. A newly added related work SHALL NOT be assigned one.

#### Scenario: Adding a new King work without an explicit shuffle position
- **WHEN** a new King work is added to the canonical list without an explicit shuffle position
- **THEN** the system assigns it the next available shuffle position automatically

#### Scenario: Adding a new related work
- **WHEN** a new work labelled `related` is added
- **THEN** the system does not assign it a shuffle position
