## MODIFIED Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish date, a unique URL slug, an optional Open Library work key for matching against Open Library search results, an optional Open Library cover identifier (a numeric cover ID) for building a cover image URL, a Dark Tower flag indicating whether the work is one of the core Dark Tower series works, a Bachman flag, and an optional Dark Tower relation note describing how the work connects to the Dark Tower series.

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish date, a unique URL slug, either an Open Library work key or no key, either an Open Library cover identifier or no cover identifier, a Dark Tower flag, a Bachman flag, and either a Dark Tower relation note or no note

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

### Requirement: Retrieve a single King work by slug
The system SHALL provide a way for application code to fetch a single King work by its slug, including the same fields returned when fetching the full list, or to determine that no work matches that slug.

#### Scenario: Fetching a work that exists
- **WHEN** application code requests a King work by a slug that matches an existing work
- **THEN** it receives that work's stored fields

#### Scenario: Fetching a work that does not exist
- **WHEN** application code requests a King work by a slug that matches no existing work
- **THEN** it receives an indication that no work matches
