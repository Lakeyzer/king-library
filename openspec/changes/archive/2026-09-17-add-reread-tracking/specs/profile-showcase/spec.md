## ADDED Requirements

### Requirement: Reading timeline shows every logged read, not just the most recent
The system SHALL display, on the reading timeline (part of the Reader Checklist tab), one entry per logged read belonging to the profile owner, ordered most-recent first, rather than a single entry per King work. This compact widget SHALL show only each entry's work and date; note, format, and rating are not shown here — they appear on the dedicated Reading Timeline page (see the reading-timeline capability).

#### Scenario: A work read multiple times shows multiple entries
- **WHEN** a profile owner has logged more than one read for the same King work
- **THEN** the reading timeline shows a separate entry for each logged read of that work

#### Scenario: Reading timeline widget omits note, format, and rating
- **WHEN** a profile owner has logged a read with a note, format, and/or rating captured
- **THEN** the reading timeline widget shows only that entry's work and date, without its note, format, or rating

#### Scenario: Timeline entries for the same work are independent
- **WHEN** a profile owner views the reading timeline for a work they have read more than once
- **THEN** each entry for that work reflects only its own logged read's date, not any other logged read's date

### Requirement: Reading Journey heading links to the dedicated Reading Timeline page
The system SHALL show, on the same line as the Reading Journey heading and end-justified, a control that links to the profile owner's dedicated Reading Timeline page (see the reading-timeline capability).

#### Scenario: Reading Journey heading shows a link to the full timeline
- **WHEN** a showcase is displayed
- **THEN** a control end-justified on the Reading Journey heading's line links to that profile owner's Reading Timeline page

#### Scenario: Following the link
- **WHEN** a visitor activates the Reading Journey heading's timeline link
- **THEN** they are taken to the profile owner's dedicated Reading Timeline page

## MODIFIED Requirements

### Requirement: Currently Reading section shows in-progress works
The system SHALL display, on a showcase, cover art and title for every active King work the profile owner currently has marked currently-reading, at every supported viewport width, and SHALL display an empty state when none are currently-reading. Inactive King works SHALL be excluded even if marked currently-reading. When a format was captured for that work's current reading session, the system SHALL show that format's label and an icon representing it beneath the title. The Currently Reading section SHALL be visually distinguished from the personalized recommendation cards shown alongside it in the same sidebar.

#### Scenario: One work currently reading
- **WHEN** a showcase is displayed for a profile owner with exactly one active King work marked currently-reading
- **THEN** the Currently Reading section shows that work's cover art and title

#### Scenario: Multiple works currently reading
- **WHEN** a showcase is displayed for a profile owner with more than one active King work marked currently-reading
- **THEN** the Currently Reading section shows cover art and title for all of them

#### Scenario: No works currently reading
- **WHEN** a showcase is displayed for a profile owner with no active King work marked currently-reading
- **THEN** the Currently Reading section shows an empty state instead of any cover art

#### Scenario: Only an inactive work is currently reading
- **WHEN** a profile owner's only currently-reading King work has an active flag of false
- **THEN** the Currently Reading section shows an empty state instead of that work's cover art

#### Scenario: A format captured for the reading session shows its label and icon
- **WHEN** a profile owner is currently reading a work for which a format was captured when they started reading it
- **THEN** the Currently Reading section shows that format's label and an icon representing it beneath the work's title

#### Scenario: No format captured shows no format line
- **WHEN** a profile owner is currently reading a work for which no format was captured
- **THEN** the Currently Reading section shows no format label or icon for that work, only its title

#### Scenario: Currently Reading is visually distinguished from recommendations
- **WHEN** a showcase's sidebar shows both the Currently Reading section and one or more personalized recommendation cards
- **THEN** the Currently Reading section is visually distinguishable from the recommendation cards, despite sharing the same card layout and sizing
