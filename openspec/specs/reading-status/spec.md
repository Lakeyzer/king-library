# reading-status Specification

## Purpose

Lets a signed-in user record their reading intent and progress against a King work — wanting to read it, currently reading it, or having read it — independent of whether they own a copy.

## Requirements

### Requirement: User can toggle want-to-read on a work
The system SHALL let a signed-in user mark a King work as want-to-read, or unmark it, with a single action and no confirmation step. If the user has no existing reading-status record for that work, the system SHALL create one.

#### Scenario: Marking a work as want-to-read
- **WHEN** a signed-in user activates the want-to-read control on a work that is not currently marked want-to-read
- **THEN** the work's want-to-read state becomes true

#### Scenario: Unmarking want-to-read
- **WHEN** a signed-in user activates the want-to-read control on a work that is currently marked want-to-read
- **THEN** the work's want-to-read state becomes false

#### Scenario: No reading-status record exists yet
- **WHEN** a signed-in user marks a work as want-to-read for the first time
- **THEN** the system creates a reading-status record for that user and work with want-to-read true

### Requirement: User can start reading a work with a start date
The system SHALL let a signed-in user start reading a King work that is not already currently-reading by supplying a start date, defaulted to the current date in the user's local timezone and adjustable before confirming. The start date SHALL be required — the user cannot confirm without one.

#### Scenario: Opening the start-reading prompt
- **WHEN** a signed-in user activates the reading control on a work that is not currently-reading
- **THEN** the system prompts for a start date, prefilled with today's date computed from the browser's local date

#### Scenario: Confirming a start date
- **WHEN** a signed-in user confirms the start-reading prompt with a start date
- **THEN** the work becomes currently-reading and its start date is set to the confirmed date

#### Scenario: Adjusting the prefilled start date
- **WHEN** a signed-in user changes the prefilled start date before confirming
- **THEN** the work's start date is set to the user-chosen date, not the prefilled default

### Requirement: User can finish a currently-reading work with an end date
The system SHALL let a signed-in user finish a King work that is currently-reading by supplying an end date, defaulted to the current date in the user's local timezone and adjustable before confirming. Finishing SHALL mark the work as read and SHALL NOT change its previously recorded start date.

#### Scenario: Opening the finish prompt
- **WHEN** a signed-in user activates the reading control on a work that is currently-reading
- **THEN** the system prompts for an end date, prefilled with today's date computed from the browser's local date

#### Scenario: Confirming an end date
- **WHEN** a signed-in user confirms the finish prompt with an end date
- **THEN** the work becomes read and its finish date is set to the confirmed date, while its start date is unchanged

### Requirement: User can mark a work as read directly, with optional dates
The system SHALL let a signed-in user mark a King work as read without first marking it currently-reading, via a prompt offering a start date, an end date, and a year, all optional and independently skippable.

#### Scenario: Marking read with no dates supplied
- **WHEN** a signed-in user confirms the mark-as-read prompt with the start date, end date, and year all left blank
- **THEN** the work becomes read with its start date, finish date, and year all left unset

#### Scenario: Marking read with a full date range
- **WHEN** a signed-in user confirms the mark-as-read prompt with both a start date and an end date supplied
- **THEN** the work becomes read with its start date and finish date set to the supplied values

#### Scenario: Marking read with only a year
- **WHEN** a signed-in user confirms the mark-as-read prompt with only a year supplied
- **THEN** the work becomes read with its year set to the supplied value and its start date and finish date left unset

### Requirement: User can unmark a work as read
The system SHALL let a signed-in user unmark a King work that is read, setting its read state back to false while leaving its previously recorded start date, finish date, and year unchanged.

#### Scenario: Unmarking a read work
- **WHEN** a signed-in user activates the unmark-read control on a work that is read
- **THEN** the work's read state becomes false and its start date, finish date, and year are unchanged

#### Scenario: Unmarking does not restore want-to-read or currently-reading
- **WHEN** a signed-in user unmarks a work as read
- **THEN** the work's want-to-read and currently-reading states remain false

### Requirement: Reading-status writes never need to enforce state invariants client-side
The system SHALL rely on server-enforced invariants for mutual exclusion between want-to-read, currently-reading, and read, rather than duplicating that logic in the client: setting currently-reading true clears want-to-read, and setting read true clears both want-to-read and currently-reading.

#### Scenario: Starting a want-to-read work clears want-to-read
- **WHEN** a signed-in user starts reading a work that was marked want-to-read
- **THEN** the work's want-to-read state becomes false and its currently-reading state becomes true

#### Scenario: Marking a currently-reading work as read clears currently-reading
- **WHEN** a signed-in user finishes a work that was currently-reading
- **THEN** the work's currently-reading state becomes false and its read state becomes true
