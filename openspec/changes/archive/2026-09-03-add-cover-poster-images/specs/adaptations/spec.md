## MODIFIED Requirements

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

### Requirement: Retrieve all adaptations for display
The system SHALL provide a way for application code to fetch the full list of adaptations for display, including each adaptation's title, release year, type, and TMDb poster path.

#### Scenario: Fetching all adaptations
- **WHEN** application code requests all adaptations
- **THEN** it receives every adaptation currently in storage, including title, release year, type, and TMDb poster path
