# adaptations Specification

## Purpose

Defines the canonical list of Stephen King screen adaptations and how each one links back to the King work(s) and/or short story(ies) it draws on, independent of the books/short-stories domains, so a "based on" list and popularity comparisons can be built without assuming every adaptation has exactly one source.

## Requirements

### Requirement: Canonical adaptation storage
The system SHALL persist a canonical list of King screen adaptations, each with a title, a type, a release year, an optional numeric TMDb id paired with which TMDb media type ("movie" or "tv") it belongs to, an optional TMDb poster path (as returned by TMDb, for building a poster image URL), a flag indicating whether the adaptation only draws on King's characters/settings/universe without adapting a specific work, and an optional free-text note.

#### Scenario: An adaptation has the expected fields
- **WHEN** an adaptation is stored in the canonical list
- **THEN** it has a title, a type, a release year, either a TMDb id and media type or neither, either a TMDb poster path or no poster path, a universe-only flag, and either a note or no note

#### Scenario: An adaptation defaults to not universe-only
- **WHEN** an adaptation is stored without an explicit universe-only flag
- **THEN** its universe-only flag is false

#### Scenario: An adaptation with no known poster has no poster path
- **WHEN** an adaptation has no poster art known on TMDb
- **THEN** its TMDb poster path is absent (null)

### Requirement: Public read access to adaptations
Anyone, including unauthenticated visitors, SHALL be able to read the full list of adaptations.

#### Scenario: Anonymous visitor reads the list
- **WHEN** an unauthenticated visitor requests the list of adaptations
- **THEN** the system returns all adaptations in storage

### Requirement: No client-side writes to adaptations
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete adaptations through the application.

#### Scenario: Authenticated user attempts to write
- **WHEN** an authenticated user's client attempts to insert, update, or delete an adaptation
- **THEN** the system rejects the operation

### Requirement: Seed data reflects the canonical adaptation list
The system's initial adaptation data SHALL include "Carrie" (1976, type movie), "The Shining" (1980, type movie), and "Creepshow" (1982, type movie), each with a universe-only flag of false.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical adaptation data is loaded into the system
- **THEN** the list includes "Carrie", "The Shining", and "Creepshow" with their correct type, release year, and a universe-only flag of false

### Requirement: Retrieve all adaptations for display
The system SHALL provide a way for application code to fetch the full list of adaptations for display, including each adaptation's title, release year, type, and TMDb poster path.

#### Scenario: Fetching all adaptations
- **WHEN** application code requests all adaptations
- **THEN** it receives every adaptation currently in storage, including title, release year, type, and TMDb poster path

### Requirement: Adaptation to King work linking
The system SHALL persist, for each adaptation, which canonical King work(s) it is based on, allowing an adaptation to be based on more than one work.

#### Scenario: An adaptation linked to its source work
- **WHEN** an adaptation is based on a King work
- **THEN** the system has a link recording that the adaptation is based on that work

#### Scenario: An adaptation based on multiple works
- **WHEN** an adaptation draws on more than one King work
- **THEN** the system has a separate link for each work it draws on

### Requirement: Adaptation to short story linking
The system SHALL persist, for each adaptation, which canonical short story(ies) it is based on, allowing an adaptation to be based on more than one short story and to combine short story sources with King work sources on the same adaptation.

#### Scenario: An adaptation linked to its source short story
- **WHEN** an adaptation is based on a short story rather than an independently-shelved work
- **THEN** the system has a link recording that the adaptation is based on that short story

#### Scenario: An anthology adaptation based on multiple short stories
- **WHEN** an adaptation draws on more than one short story
- **THEN** the system has a separate link for each short story it draws on

### Requirement: Universe-only adaptations need no source links
The system SHALL allow an adaptation flagged as universe-only to have no links in either the King work or short story linking sets, and SHALL allow any other adaptation to have links in one, both, or in rare cases both of those sets alongside a universe-only flag of false.

#### Scenario: A universe-only adaptation has no source links
- **WHEN** an adaptation has a universe-only flag of true
- **THEN** the system does not require any King work or short story link for that adaptation

### Requirement: No client-side writes to adaptation source links
The system SHALL NOT allow any client, authenticated or not, to create, modify, or delete adaptation-to-work or adaptation-to-short-story links through the application.

#### Scenario: Authenticated user attempts to write a source link
- **WHEN** an authenticated user's client attempts to insert, update, or delete an adaptation source link
- **THEN** the system rejects the operation
