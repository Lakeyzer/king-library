# king-works Specification

## Purpose

Defines the canonical Stephen King bibliography: a publicly readable, seed-file-driven list of King's works that every other feature (collections, wishlist, read tracking, stats) treats as the source of truth for "what counts as a King book."

## Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish year, an optional Open Library work key for matching against Open Library search results, an optional Open Library cover identifier (a numeric cover ID) for building a cover image URL, a Dark Tower flag indicating whether the work is one of the core Dark Tower series works, a Bachman flag, and an optional Dark Tower relation note describing how the work connects to the Dark Tower series.

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish year, either an Open Library work key or no key, either an Open Library cover identifier or no cover identifier, a Dark Tower flag, a Bachman flag, and either a Dark Tower relation note or no note

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
The system's initial King works data SHALL include Carrie (1974), 'Salem's Lot (1975), and Cujo (1981), each recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** the list includes exactly Carrie, 'Salem's Lot, and Cujo with their correct type, publish year, Open Library work key, Dark Tower flag of false, Bachman flag of false, and no Dark Tower relation note

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of King works for display, including each work's title, original publish year, type, Open Library cover identifier, Dark Tower flag, and Bachman flag.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works
- **THEN** it receives every King work currently in storage, including title, original publish year, type, Open Library cover identifier, Dark Tower flag, and Bachman flag
