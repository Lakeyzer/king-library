## MODIFIED Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish date, a unique URL slug, an optional Open Library work key for matching against Open Library search results, an optional Open Library cover identifier (a numeric cover ID) for building a cover image URL, a Dark Tower flag indicating whether the work is one of the core Dark Tower series works, a Bachman flag, an optional Dark Tower relation note describing how the work connects to the Dark Tower series, and a shuffle position: a unique integer used to deterministically rotate which work is featured as "Book of the week."

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish date, a unique URL slug, either an Open Library work key or no key, either an Open Library cover identifier or no cover identifier, a Dark Tower flag, a Bachman flag, either a Dark Tower relation note or no note, and a shuffle position

#### Scenario: A work defaults to not Dark Tower and not Bachman
- **WHEN** a King work is stored without an explicit Dark Tower flag or Bachman flag
- **THEN** its Dark Tower flag is false and its Bachman flag is false

#### Scenario: A work with no connection to the Dark Tower has no relation note
- **WHEN** a King work has no connection to the Dark Tower series
- **THEN** its Dark Tower flag is false and its Dark Tower relation note is absent (null)

#### Scenario: A work connected to but not part of the Dark Tower series
- **WHEN** a King work shares characters, settings, or events with the Dark Tower series without being one of its entries
- **THEN** its Dark Tower flag is false and its Dark Tower relation note describes the connection

#### Scenario: A work with no known cover has no cover identifier
- **WHEN** a King work has no cover art known on Open Library (or is not the kind of work Open Library covers, such as an unreleased title)
- **THEN** its Open Library cover identifier is absent (null)

#### Scenario: No two works share a slug
- **WHEN** a King work is stored in the canonical list
- **THEN** its slug is unique among all King works' slugs

## ADDED Requirements

### Requirement: Shuffle position is unique and densely assigned
The system SHALL assign every King work a unique shuffle position, with the full set of shuffle positions across all King works forming a contiguous range with no gaps and no two works sharing the same value.

#### Scenario: No two works share a shuffle position
- **WHEN** a King work is stored in the canonical list
- **THEN** its shuffle position is unique among all King works' shuffle positions

#### Scenario: Shuffle positions have no gaps
- **WHEN** the full set of King works' shuffle positions is examined
- **THEN** it forms a contiguous range with no skipped values

### Requirement: New King works are auto-assigned the next available shuffle position
The system SHALL automatically assign a newly added King work the next available shuffle position (one past the current highest assigned value) when no shuffle position is explicitly supplied, so adding a new book to the canonical list requires no manual update to any rotation schedule.

#### Scenario: Adding a new King work without an explicit shuffle position
- **WHEN** a new King work is added to the canonical list without an explicit shuffle position
- **THEN** the system assigns it the next available shuffle position automatically
