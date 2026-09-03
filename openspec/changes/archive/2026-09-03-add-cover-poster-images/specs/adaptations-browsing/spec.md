## MODIFIED Requirements

### Requirement: Adaptations page lists all canonical adaptations
The system SHALL provide a page that displays every adaptation from the canonical list in a table, showing each adaptation's title, release year, type, and a poster thumbnail.

#### Scenario: Visiting the adaptations page
- **WHEN** a visitor navigates to the adaptations page
- **THEN** the page displays a table row for every adaptation in the canonical list, showing its title, release year, type, and a poster thumbnail

#### Scenario: An adaptation has a poster path
- **WHEN** an adaptation in the table has a TMDb poster path
- **THEN** its row shows a poster thumbnail image built from that path

#### Scenario: An adaptation has no poster path
- **WHEN** an adaptation in the table has no TMDb poster path
- **THEN** its row shows a generic placeholder image in place of a poster thumbnail

## ADDED Requirements

### Requirement: Adaptations table poster images load lazily and fail gracefully
The system SHALL lazy-load poster thumbnails in the adaptations table and SHALL fall back to the generic placeholder image if a poster image fails to load.

#### Scenario: A poster image fails to load
- **WHEN** an adaptation's poster thumbnail image cannot be retrieved from its image source
- **THEN** the table shows the generic placeholder image for that row instead of a broken image
