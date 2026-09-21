# dark-tower-page Specification

## Purpose

Gives fans a dedicated home for the Dark Tower series: the eight core novels in canonical reading order, the wider constellation of connected King works, and - when signed in - personalized reading progress and "read next" nudges scoped to just this corner of the bibliography.

## Requirements

### Requirement: Dark Tower page has a main content area and a sidebar
The system SHALL provide a page at `/dark-tower` laid out as a main content area alongside a sidebar, in the same main-plus-sidebar arrangement as the Works page. The sidebar SHALL be reserved for the signed-in-only widgets described elsewhere in this capability; the main content area SHALL be visible to every visitor, signed in or not.

#### Scenario: Visiting the Dark Tower page
- **WHEN** any visitor navigates to `/dark-tower`
- **THEN** the page shows a main content area and a sidebar, with the main content area displaying the core-series list and the related-works list

### Requirement: Main area lists the eight core Dark Tower novels in canonical reading order
The system SHALL display, in the main content area, all eight core Dark Tower novels - The Gunslinger, The Drawing of the Three, The Waste Lands, Wizard and Glass, The Wind Through the Keyhole, Wolves of the Calla, Song of Susannah, and The Dark Tower - ordered by their position within the canonical Dark Tower series, not by publish date. This places The Wind Through the Keyhole fifth, between Wizard and Glass and Wolves of the Calla, reflecting its in-story chronological placement rather than its later publish date.

#### Scenario: Core list follows series position
- **WHEN** any visitor views the Dark Tower page's core-series list
- **THEN** the eight core novels appear in the order The Gunslinger, The Drawing of the Three, The Waste Lands, Wizard and Glass, The Wind Through the Keyhole, Wolves of the Calla, Song of Susannah, The Dark Tower

### Requirement: Main area lists Dark Tower-connected works
The system SHALL display, in the main content area, a "Related Works" list of every active King work that has a Dark Tower relation note (and is not itself one of the eight core novels), each item showing its title and its relation note.

#### Scenario: A related work is shown with its note
- **WHEN** any visitor views the Dark Tower page's Related Works list
- **THEN** it includes every active King work with a Dark Tower relation note, each showing that note

#### Scenario: An inactive related work is excluded
- **WHEN** a King work has a Dark Tower relation note but its active flag is false
- **THEN** it does not appear in the Related Works list

### Requirement: Signed-in visitor sees Dark Tower reading progress
The system SHALL show a signed-in visitor, in the sidebar, their reading progress across the eight core Dark Tower novels - the same count-of-read-over-total figure and presentation already shown on their profile's Dark Tower progress bar. The system SHALL NOT show this to a signed-out visitor.

#### Scenario: Signed-in visitor views their Dark Tower progress
- **WHEN** a signed-in visitor views the Dark Tower page
- **THEN** the sidebar shows how many of the eight core novels they have read, matching the Dark Tower figure shown on their profile

#### Scenario: Signed-out visitor sees no Dark Tower progress
- **WHEN** a signed-out visitor views the Dark Tower page
- **THEN** the sidebar shows no Dark Tower reading progress

### Requirement: Signed-in visitor sees Dark Tower Related reading progress
The system SHALL show a signed-in visitor, in the sidebar, their reading progress across the Related Works list - a count of how many of those works they have read out of the total. The system SHALL NOT show this to a signed-out visitor.

#### Scenario: Signed-in visitor views their Related Works progress
- **WHEN** a signed-in visitor views the Dark Tower page
- **THEN** the sidebar shows how many of the Related Works they have read out of the total

#### Scenario: Signed-out visitor sees no Related Works progress
- **WHEN** a signed-out visitor views the Dark Tower page
- **THEN** the sidebar shows no Dark Tower Related reading progress

### Requirement: Signed-in visitor is suggested the next core Dark Tower book to read
The system SHALL show a signed-in visitor, in the sidebar, a suggestion to read one specific core Dark Tower novel whenever they have not read all eight - specifically, the unread core novel with the lowest position in the canonical series order. The system SHALL show nothing in its place once all eight are read, and SHALL NOT show this to a signed-out visitor.

#### Scenario: Visitor has not read all core novels
- **WHEN** a signed-in visitor has read some but not all of the eight core Dark Tower novels
- **THEN** the sidebar suggests the unread core novel with the lowest series position among those they have not read

#### Scenario: Visitor has read every core novel
- **WHEN** a signed-in visitor has read all eight core Dark Tower novels
- **THEN** the sidebar shows no core-book suggestion

#### Scenario: Signed-out visitor sees no core-book suggestion
- **WHEN** a signed-out visitor views the Dark Tower page
- **THEN** the sidebar shows no core-book suggestion

### Requirement: Signed-in visitor is suggested a Dark Tower Related book to read
The system SHALL show a signed-in visitor, in the sidebar, a suggestion to read one Related Works entry whenever they have not read every Related Works entry - picked at random among the unread ones. The system SHALL show nothing in its place once every Related Works entry is read, and SHALL NOT show this to a signed-out visitor.

#### Scenario: Visitor has not read all related works
- **WHEN** a signed-in visitor has not read every Related Works entry
- **THEN** the sidebar suggests one of the unread Related Works entries

#### Scenario: Visitor has read every related work
- **WHEN** a signed-in visitor has read every Related Works entry
- **THEN** the sidebar shows no related-work suggestion

#### Scenario: Signed-out visitor sees no related-work suggestion
- **WHEN** a signed-out visitor views the Dark Tower page
- **THEN** the sidebar shows no related-work suggestion

### Requirement: Primary navigation links to the Dark Tower page
The system SHALL include a link to `/dark-tower` in primary navigation, reachable from anywhere in the app.

#### Scenario: Navigating from primary navigation
- **WHEN** any visitor activates the Dark Tower link in primary navigation
- **THEN** they are taken to `/dark-tower`
