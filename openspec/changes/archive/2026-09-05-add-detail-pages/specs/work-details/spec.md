## Purpose

Gives every King work a permanent, linkable detail page that shows its core information plus live-enriched detail from Open Library, and shows how it connects to adaptations and (for collections) short stories.

## ADDED Requirements

### Requirement: Work detail page is reachable by slug
The system SHALL provide a detail page for each canonical King work, addressed by that work's slug, showing the work's title, type, original publish date, cover (when a cover identifier is known), and Dark Tower/Bachman flags when set.

#### Scenario: Visiting a work's detail page
- **WHEN** a visitor navigates to a King work's detail page using its slug
- **THEN** the page displays that work's title, type, original publish date, cover (if a cover identifier is known), and Dark Tower/Bachman flags (if set)

#### Scenario: Slug does not match any work
- **WHEN** a visitor navigates to a work detail URL whose slug does not match any canonical King work
- **THEN** the system shows a not-found result instead of a detail page

### Requirement: Work list items link to their detail page
The system SHALL make each work's list item on the works browsing page a link to that work's detail page.

#### Scenario: Following a list item to its detail page
- **WHEN** a visitor selects a work's list item (or its title) on the works browsing page
- **THEN** they are taken to that work's detail page

### Requirement: Work detail page shows live Open Library enrichment
The system SHALL, when a work has an Open Library work key, fetch and display additional detail for that work live from Open Library (at minimum a description/synopsis, when Open Library provides one for that work). When a work has no Open Library work key, or the live fetch fails, the system SHALL still show the work's locally-stored details without the enrichment.

#### Scenario: Work has an Open Library work key
- **WHEN** a visitor views the detail page of a work with an Open Library work key
- **THEN** the page displays additional detail fetched live from Open Library for that work, alongside its locally-stored details

#### Scenario: Work has no Open Library work key
- **WHEN** a visitor views the detail page of a work with no Open Library work key
- **THEN** the page displays only the work's locally-stored details, with no Open Library enrichment section shown as loading or broken

#### Scenario: Live Open Library fetch fails
- **WHEN** the live Open Library fetch for a work's enrichment fails
- **THEN** the page still displays the work's locally-stored details, without the enrichment and without blocking the rest of the page

### Requirement: Work detail page shows connected adaptations
The system SHALL show, on a work's detail page, every adaptation based on that work, each linking to that adaptation's own detail page.

#### Scenario: Work has one or more adaptations
- **WHEN** a visitor views the detail page of a work that one or more adaptations are based on
- **THEN** the page lists each of those adaptations, and selecting one takes the visitor to that adaptation's detail page

#### Scenario: Work has no adaptations
- **WHEN** a visitor views the detail page of a work with no adaptations based on it
- **THEN** the page shows no adaptations in its connections

### Requirement: Collection work detail page shows its short stories
The system SHALL show, on the detail page of a King work of type collection, every short story that appears in that collection.

#### Scenario: Viewing a collection's detail page
- **WHEN** a visitor views the detail page of a King work of type collection
- **THEN** the page lists every short story that appears in that collection

#### Scenario: Viewing a non-collection work's detail page
- **WHEN** a visitor views the detail page of a King work that is not of type collection
- **THEN** the page shows no short stories section

### Requirement: Work detail page presents reading-status controls as separate actions
The system SHALL present the signed-in user's reading-status controls on a work's detail page using the expanded display mode (see the reading-status capability), showing each available action as its own control rather than a single primary action with the rest grouped behind it.

#### Scenario: Signed-in user views a work's detail page
- **WHEN** a signed-in user views a King work's detail page
- **THEN** the reading-status controls for that work are shown in the expanded display mode

#### Scenario: Signed-out visitor views a work's detail page
- **WHEN** a signed-out visitor views a King work's detail page
- **THEN** no reading-status controls are shown
