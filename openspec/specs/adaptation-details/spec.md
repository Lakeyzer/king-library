# adaptation-details Specification

## Purpose

Gives every screen adaptation a permanent, linkable detail page that shows its core information plus live-enriched detail from TMDb, and shows which King work(s) and/or short stories it's based on.

## Requirements

### Requirement: Adaptation detail page is reachable by slug
The system SHALL provide a detail page for each canonical adaptation, addressed by that adaptation's slug, showing the adaptation's title, type, release year, poster (when a poster path is known), and any free-text note.

#### Scenario: Visiting an adaptation's detail page
- **WHEN** a visitor navigates to an adaptation's detail page using its slug
- **THEN** the page displays that adaptation's title, type, release year, poster (if a poster path is known), and note (if set)

#### Scenario: Slug does not match any adaptation
- **WHEN** a visitor navigates to an adaptation detail URL whose slug does not match any canonical adaptation
- **THEN** the system shows a not-found result instead of a detail page

### Requirement: Adaptation list items link to their detail page
The system SHALL make each adaptation's list item on the adaptations browsing page a link to that adaptation's detail page.

#### Scenario: Following a list item to its detail page
- **WHEN** a visitor selects an adaptation's list item (or its title) on the adaptations browsing page
- **THEN** they are taken to that adaptation's detail page

### Requirement: Adaptation detail page shows live TMDb enrichment
The system SHALL, when an adaptation has a TMDb id and media type, fetch and display additional detail for that adaptation live from TMDb (at minimum an overview/synopsis, when TMDb provides one). When an adaptation has no TMDb id, or the live fetch fails, the system SHALL still show the adaptation's locally-stored details without the enrichment.

#### Scenario: Adaptation has a TMDb id
- **WHEN** a visitor views the detail page of an adaptation with a TMDb id and media type
- **THEN** the page displays additional detail fetched live from TMDb for that title, alongside its locally-stored details

#### Scenario: Adaptation has no TMDb id
- **WHEN** a visitor views the detail page of an adaptation with no TMDb id
- **THEN** the page displays only the adaptation's locally-stored details, with no TMDb enrichment section shown as loading or broken

#### Scenario: Live TMDb fetch fails
- **WHEN** the live TMDb fetch for an adaptation's enrichment fails
- **THEN** the page still displays the adaptation's locally-stored details, without the enrichment and without blocking the rest of the page

### Requirement: Adaptation detail page shows what it's based on
The system SHALL show, on an adaptation's detail page, every King work and every short story that adaptation is based on. Each King work SHALL link to that work's own detail page; each short story SHALL be shown without a link.

#### Scenario: Adaptation based on one or more works
- **WHEN** a visitor views the detail page of an adaptation based on one or more King works
- **THEN** the page lists each of those works, and selecting one takes the visitor to that work's detail page

#### Scenario: Adaptation based on one or more short stories
- **WHEN** a visitor views the detail page of an adaptation based on one or more short stories
- **THEN** the page lists each of those short stories, without a link

#### Scenario: Universe-only adaptation has nothing to show
- **WHEN** a visitor views the detail page of a universe-only adaptation with no linked works or short stories
- **THEN** the page shows no "based on" connections
