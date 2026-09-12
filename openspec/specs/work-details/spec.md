# work-details Specification

## Purpose

Gives every King work a permanent, linkable detail page that shows its core information plus live-enriched detail from Open Library, and shows how it connects to adaptations and (for collections) short stories.

## Requirements

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

### Requirement: Work detail page shows an owner count
The system SHALL display, on a King work's detail page, the count of users who have marked that work owned, alongside its other reading-status counts.

#### Scenario: Viewing a work's owner count
- **WHEN** a visitor views a King work's detail page
- **THEN** the page displays the count of users who have marked that work owned

### Requirement: Charlie the Choo-Choo detail page's author loops between two forms, with an animated transition
The Charlie the Choo-Choo work detail page SHALL display an author byline reading "Beryl Evans" on load. While the page remains open, the byline SHALL alternate indefinitely between "Beryl Evans" and "Claudia y Inez Bachman" at a regular interval, referencing the *Wolves of the Calla* book-within-a-book gag. Each change from one name to the other SHALL use a visible animated transition (e.g. a letter-scramble effect) rather than swapping instantly. No other work detail page SHALL show this behavior.

#### Scenario: Loading the Charlie the Choo-Choo detail page
- **WHEN** a visitor loads the Charlie the Choo-Choo work detail page
- **THEN** the author byline initially reads "Beryl Evans"

#### Scenario: Byline animates to the alternate name after a delay
- **WHEN** a visitor has had the Charlie the Choo-Choo work detail page open for the loop's interval
- **THEN** the author byline animates from its current name to the other one, ending on the full alternate name

#### Scenario: Byline keeps alternating indefinitely
- **WHEN** a visitor keeps the Charlie the Choo-Choo work detail page open across multiple intervals
- **THEN** the author byline keeps alternating between "Beryl Evans" and "Claudia y Inez Bachman" for as long as the page stays open, rather than settling permanently on either name

#### Scenario: Other work detail pages are unaffected
- **WHEN** a visitor loads any work detail page other than Charlie the Choo-Choo
- **THEN** no author byline loop or animation occurs

### Requirement: Misery detail page glitches the letter N
The Misery work detail page SHALL render every occurrence of the letter "N" (uppercase and lowercase) within the page's own content - excluding the site header and footer - with reduced opacity, referencing Paul Sheldon's typewriter missing its N key. No other work detail page SHALL show this treatment.

#### Scenario: Viewing the Misery detail page
- **WHEN** a visitor loads the Misery work detail page
- **THEN** every letter "N" or "n" in the page's own content is rendered at reduced opacity relative to the surrounding text, and the site header and footer are unaffected

#### Scenario: Other work detail pages are unaffected
- **WHEN** a visitor loads any work detail page other than Misery
- **THEN** no letter is rendered with the reduced-opacity treatment
