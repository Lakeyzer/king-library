## MODIFIED Requirements

### Requirement: Canonical adaptation storage
The system SHALL persist a canonical list of King screen adaptations, each with a title, a type, a release year, a unique URL slug, an optional numeric TMDb id paired with which TMDb media type ("movie" or "tv") it belongs to, an optional TMDb poster path (as returned by TMDb, for building a poster image URL), a flag indicating whether the adaptation only draws on King's characters/settings/universe without adapting a specific work, and an optional free-text note.

#### Scenario: An adaptation has the expected fields
- **WHEN** an adaptation is stored in the canonical list
- **THEN** it has a title, a type, a release year, a unique URL slug, either a TMDb id and media type or neither, either a TMDb poster path or no poster path, a universe-only flag, and either a note or no note

#### Scenario: An adaptation defaults to not universe-only
- **WHEN** an adaptation is stored without an explicit universe-only flag
- **THEN** its universe-only flag is false

#### Scenario: An adaptation with no known poster has no poster path
- **WHEN** an adaptation has no poster art known on TMDb
- **THEN** its TMDb poster path is absent (null)

#### Scenario: No two adaptations share a slug
- **WHEN** an adaptation is stored in the canonical list
- **THEN** its slug is unique among all adaptations' slugs

## ADDED Requirements

### Requirement: Retrieve a single adaptation by slug
The system SHALL provide a way for application code to fetch a single adaptation by its slug, together with the King work(s) and short story(ies) it is based on, or to determine that no adaptation matches that slug.

#### Scenario: Fetching an adaptation that exists
- **WHEN** application code requests an adaptation by a slug that matches an existing adaptation
- **THEN** it receives that adaptation's stored fields along with the King work(s) and/or short story(ies) it is based on

#### Scenario: Fetching an adaptation that does not exist
- **WHEN** application code requests an adaptation by a slug that matches no existing adaptation
- **THEN** it receives an indication that no adaptation matches
