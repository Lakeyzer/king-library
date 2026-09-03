## MODIFIED Requirements

### Requirement: Works page lists all canonical King works
The system SHALL provide a page that displays every King work from the canonical bibliography in a table, showing each work's title, original publish year, type, Bachman flag, Dark Tower flag, and a cover thumbnail.

#### Scenario: Visiting the works page
- **WHEN** a visitor navigates to the works page
- **THEN** the page displays a table row for every King work in the canonical bibliography, showing its title, original publish year, type, Bachman flag, Dark Tower flag, and a cover thumbnail

#### Scenario: A work has a cover identifier
- **WHEN** a King work in the table has an Open Library cover identifier
- **THEN** its row shows a cover thumbnail image built from that identifier

#### Scenario: A work has no cover identifier
- **WHEN** a King work in the table has no Open Library cover identifier
- **THEN** its row shows a generic placeholder image in place of a cover thumbnail

## ADDED Requirements

### Requirement: Works table cover images load lazily and fail gracefully
The system SHALL lazy-load cover thumbnails in the works table and SHALL fall back to the generic placeholder image if a cover image fails to load.

#### Scenario: A cover image fails to load
- **WHEN** a work's cover thumbnail image cannot be retrieved from its image source
- **THEN** the table shows the generic placeholder image for that row instead of a broken image
