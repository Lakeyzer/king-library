## MODIFIED Requirements

### Requirement: Watch List shows its owner's want-to-watch adaptations
The system SHALL display, on a Watch List page, every active adaptation its owner has marked want-to-watch, and SHALL display an empty state when they have marked none. An inactive adaptation SHALL NOT appear, even if marked want-to-watch.

#### Scenario: Owner has want-to-watch adaptations
- **WHEN** a Watch List is displayed for an owner with one or more active adaptations marked want-to-watch
- **THEN** the page shows every active adaptation they've marked want-to-watch

#### Scenario: Owner has nothing queued to watch
- **WHEN** a Watch List is displayed for an owner with no active adaptations marked want-to-watch
- **THEN** the page shows an empty state instead of any adaptations

#### Scenario: A want-to-watch adaptation becomes inactive
- **WHEN** an adaptation marked want-to-watch by the Watch List's owner is later marked inactive
- **THEN** that adaptation no longer appears on the Watch List
