## ADDED Requirements

### Requirement: Reading status controls support an expanded display mode
The system SHALL support presenting a work's reading-status controls in an expanded display mode, in which every action available for the work's current reading state (per the requirements above) is shown as its own separately activatable control, rather than one primary action with the rest grouped behind a single secondary control. The expanded mode SHALL make available exactly the same actions, with exactly the same effects, as the existing compact presentation for the same reading state.

#### Scenario: Neutral state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work with no reading-status record
- **THEN** separate controls are shown for want-to-read, start-reading, and mark-as-read

#### Scenario: Want-to-read state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked want-to-read
- **THEN** separate controls are shown for removing want-to-read, starting to read, and marking as read

#### Scenario: Currently-reading state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked currently-reading
- **THEN** separate controls are shown for finishing the work and marking it as read directly

#### Scenario: Read state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked read
- **THEN** a single control is shown for unmarking it as read

#### Scenario: Activating an expanded-mode control
- **WHEN** a signed-in user activates any control shown in the expanded display mode
- **THEN** it has the same effect on the work's reading status as activating the equivalent action in the compact presentation
