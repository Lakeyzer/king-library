## MODIFIED Requirements

### Requirement: Read List shows its owner's want-to-read King works
The system SHALL display, on a Read List page, every active work its owner has marked want-to-read, King works and By Other Hands works alike, and SHALL display an empty state when they have marked none. An inactive work SHALL NOT appear, even if marked want-to-read. Each By Other Hands item SHALL link to its By Other Hands detail page, not a King work page.

#### Scenario: Owner has want-to-read works
- **WHEN** a Read List is displayed for an owner with one or more active works marked want-to-read
- **THEN** the page shows every active work they've marked want-to-read

#### Scenario: Owner wants to read a By Other Hands work
- **WHEN** a Read List is displayed for an owner who has marked an active By Other Hands work want-to-read
- **THEN** the page shows that work, linking to its By Other Hands detail page

#### Scenario: Owner has nothing queued to read
- **WHEN** a Read List is displayed for an owner with no active works marked want-to-read
- **THEN** the page shows an empty state instead of any works

#### Scenario: A want-to-read work becomes inactive
- **WHEN** a work marked want-to-read by the Read List's owner is later marked inactive
- **THEN** that work no longer appears on the Read List
