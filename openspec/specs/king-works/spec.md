# king-works Specification

## Purpose

Defines the canonical Stephen King bibliography: a publicly readable, seed-file-driven list of King's works that every other feature (collections, wishlist, read tracking, stats) treats as the source of truth for "what counts as a King book."

## Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish year, and an optional Open Library work key for matching against Open Library search results.

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish year, and either an Open Library work key or no key

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
The system's initial King works data SHALL include Carrie (1974), 'Salem's Lot (1975), and Cujo (1981), each recorded as type "novel" with its corresponding Open Library work key.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** the list includes exactly Carrie, 'Salem's Lot, and Cujo with their correct type, publish year, and Open Library work key

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of King works for display.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works
- **THEN** it receives every King work currently in storage, including title and original publish year
