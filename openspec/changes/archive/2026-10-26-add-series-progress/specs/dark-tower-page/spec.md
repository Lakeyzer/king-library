## MODIFIED Requirements

### Requirement: Signed-in visitor sees Dark Tower reading progress
The system SHALL show a signed-in visitor, in the sidebar, their reading progress across the Dark Tower series - the same per-series count-of-read-over-total figure and presentation shown on their profile's Dark Tower series bar (see the king-series capability's per-series reading progress). The system SHALL NOT show this to a signed-out visitor.

#### Scenario: Signed-in visitor views their Dark Tower progress
- **WHEN** a signed-in visitor views the Dark Tower page
- **THEN** the sidebar shows how many of the Dark Tower series' novels they have read, matching the Dark Tower series bar on their profile

#### Scenario: Signed-out visitor sees no Dark Tower progress
- **WHEN** a signed-out visitor views the Dark Tower page
- **THEN** the sidebar shows no Dark Tower reading progress
