## MODIFIED Requirements

### Requirement: Read List shows its owner's want-to-read King works
The system SHALL display, on a Read List page, every active King work its owner has marked want-to-read, and SHALL display an empty state when they have marked none. An inactive King work SHALL NOT appear, even if marked want-to-read.

#### Scenario: Owner has want-to-read works
- **WHEN** a Read List is displayed for an owner with one or more active King works marked want-to-read
- **THEN** the page shows every active King work they've marked want-to-read

#### Scenario: Owner has nothing queued to read
- **WHEN** a Read List is displayed for an owner with no active King works marked want-to-read
- **THEN** the page shows an empty state instead of any works

#### Scenario: A want-to-read work becomes inactive
- **WHEN** a King work marked want-to-read by the Read List's owner is later marked inactive
- **THEN** that work no longer appears on the Read List
