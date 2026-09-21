# king-works Specification

## Purpose

Defines the canonical Stephen King bibliography: a publicly readable, seed-file-driven list of King's works that every other feature (collections, wishlist, read tracking, stats) treats as the source of truth for "what counts as a King book."

## Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish date, a unique URL slug, an optional Open Library work key for matching against Open Library search results, an optional Open Library cover identifier (a numeric cover ID) for building a cover image URL, a Dark Tower flag indicating whether the work is one of the core Dark Tower series works, a Bachman flag, an optional Dark Tower relation note describing how the work connects to the Dark Tower series, a shuffle position: a unique integer used to deterministically rotate which work is featured as "Book of the week," and an active flag indicating whether the work should be treated as part of the live bibliography.

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish date, a unique URL slug, either an Open Library work key or no key, either an Open Library cover identifier or no cover identifier, a Dark Tower flag, a Bachman flag, either a Dark Tower relation note or no note, a shuffle position, and an active flag

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

#### Scenario: A work defaults to active
- **WHEN** a King work is stored without an explicit active flag
- **THEN** its active flag is true

### Requirement: Retrieve a single King work by slug
The system SHALL provide a way for application code to fetch a single active King work by its slug, including the same fields returned when fetching the full list, or to determine that no active work matches that slug. An inactive work SHALL be treated the same as no match.

#### Scenario: Fetching a work that exists
- **WHEN** application code requests a King work by a slug that matches an existing work
- **THEN** it receives that work's stored fields

#### Scenario: Fetching a work that does not exist
- **WHEN** application code requests a King work by a slug that matches no existing work
- **THEN** it receives an indication that no work matches

#### Scenario: Fetching a work that exists but is inactive
- **WHEN** application code requests a King work by a slug that matches an existing work whose active flag is false
- **THEN** it receives the same indication as if no work matched

### Requirement: Public read access to King works
Anyone, including unauthenticated visitors, SHALL be able to read the full list of King works.

#### Scenario: Anonymous visitor reads the list
- **WHEN** an unauthenticated visitor requests the list of King works
- **THEN** the system returns all King works in storage

#### Scenario: Authenticated user reads the list
- **WHEN** an authenticated user requests the list of King works
- **THEN** the system returns all King works in storage

### Requirement: No client-side writes to King works
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete King works through the application.

#### Scenario: Authenticated user attempts to write
- **WHEN** an authenticated user's client attempts to insert, update, or delete a King work
- **THEN** the system rejects the operation

#### Scenario: Anonymous visitor attempts to write
- **WHEN** an unauthenticated visitor's client attempts to insert, update, or delete a King work
- **THEN** the system rejects the operation

### Requirement: Seed data reflects the canonical bibliography
The system's initial King works data SHALL include Carrie (published 1974-04-05) and Cujo (published 1981-09-08), each recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note; and 'Salem's Lot (published 1975-10-17), recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and the Dark Tower relation note described in the "Seed data includes Dark Tower relation notes for connected works" requirement below.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** the list includes exactly Carrie, 'Salem's Lot, and Cujo with their correct type, publish date, and Open Library work key; Carrie and Cujo have a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note; 'Salem's Lot has a Dark Tower flag of false, a Bachman flag of false, and its Dark Tower relation note

### Requirement: Seed data includes Dark Tower relation notes for connected works
The system's initial King works data SHALL include a Dark Tower relation note, and a Dark Tower flag of false, for each of the following works, describing how it connects to the Dark Tower series without being one of its eight core entries: 'Salem's Lot, The Stand, The Eyes of the Dragon, The Talisman, Black House, Insomnia, Rose Madder, Hearts in Atlantis, Everything's Eventual, IT, Desperation, The Regulators, and Charlie the Choo-Choo. Every other King work SHALL have no Dark Tower relation note unless individually specified otherwise.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** 'Salem's Lot, The Stand, The Eyes of the Dragon, The Talisman, Black House, Insomnia, Rose Madder, Hearts in Atlantis, Everything's Eventual, IT, Desperation, The Regulators, and Charlie the Choo-Choo each have a Dark Tower flag of false and a non-null Dark Tower relation note, and no other King work outside this list and the eight core Dark Tower novels has a Dark Tower relation note

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of active King works for display, including each work's title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note. Inactive works SHALL be excluded from this list.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works for display
- **THEN** it receives every active King work currently in storage, including title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note

#### Scenario: An inactive work is excluded
- **WHEN** application code requests all King works for display and one or more King works have an active flag of false
- **THEN** those inactive works are not included in the results

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
