# king-short-stories Specification

## Purpose

Defines the canonical bibliography of Stephen King short stories and novellas, and how each one links back to the collection(s) it has appeared in, so features like collection detail pages and Dark Tower completion tracking have a source of truth independent of `king_works`.

## Requirements

### Requirement: Canonical short story storage
The system SHALL persist a canonical list of King short stories and novellas, each with a title, a type (short story or novella), an optional original publish year, an optional note on where it first appeared outside a King collection, a Dark Tower flag, and an optional Dark Tower relation note describing how the story connects to the Dark Tower series.

#### Scenario: A short story has the expected fields
- **WHEN** a short story is stored in the canonical list
- **THEN** it has a title, a type, either an original publish year or no year, either a first-published-in note or no note, a Dark Tower flag, and either a Dark Tower relation note or no note

#### Scenario: A short story defaults to not Dark Tower
- **WHEN** a short story is stored without an explicit Dark Tower flag
- **THEN** its Dark Tower flag is false

### Requirement: Public read access to short stories
Anyone, including unauthenticated visitors, SHALL be able to read the full list of King short stories.

#### Scenario: Anonymous visitor reads the list
- **WHEN** an unauthenticated visitor requests the list of King short stories
- **THEN** the system returns all short stories in storage

### Requirement: No client-side writes to short stories
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete short stories through the application.

#### Scenario: Authenticated user attempts to write
- **WHEN** an authenticated user's client attempts to insert, update, or delete a short story
- **THEN** the system rejects the operation

### Requirement: Seed data reflects the canonical short story bibliography
The system's initial short story data SHALL include "The Mist" (1980), "Apt Pupil" (1982), "The Body" (1982), and "The Breathing Method" (1982), each recorded as type "novella" with a Dark Tower flag of false.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical short story data is loaded into the system
- **THEN** the list includes "The Mist", "Apt Pupil", "The Body", and "The Breathing Method" with their correct type, publish year, and a Dark Tower flag of false

### Requirement: Retrieve all short stories for display
The system SHALL provide a way for application code to fetch the full list of short stories for display, including each story's title, original publish year, type, and Dark Tower flag.

#### Scenario: Fetching all short stories
- **WHEN** application code requests all short stories
- **THEN** it receives every short story currently in storage, including title, original publish year, type, and Dark Tower flag

### Requirement: Short story to collection linking
The system SHALL persist, for each short story, which collection work(s) it appears in, allowing a story to appear in more than one collection.

#### Scenario: A story linked to its collection
- **WHEN** a short story has been published within a King collection
- **THEN** the system has a link recording that the short story appears in that collection's work

#### Scenario: A story reprinted across multiple collections
- **WHEN** a short story has appeared in more than one King collection over time
- **THEN** the system has a separate link for each collection it appears in

### Requirement: No client-side writes to short story collection links
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete short story collection links through the application.

#### Scenario: Authenticated user attempts to write a collection link
- **WHEN** an authenticated user's client attempts to insert, update, or delete a short story collection link
- **THEN** the system rejects the operation
