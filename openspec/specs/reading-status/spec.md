# reading-status Specification

## Purpose

Lets a signed-in user record their reading intent and progress against a King work - wanting to read it, currently reading it, or having read it - independent of whether they own a copy.

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
The system SHALL let a signed-in user start reading a King work that is not already currently-reading by supplying a start date, defaulted to the current date in the user's local timezone and adjustable before confirming, and an optional format (physical, audiobook, or ebook). The start date SHALL be required - the user cannot confirm without one; the format SHALL be independently skippable. Starting to read is independent of whether the work is already marked read: a work that is already read MAY be started again, becoming currently-reading while remaining read, without affecting any of its existing logged reads.

#### Scenario: Opening the start-reading prompt
- **WHEN** a signed-in user activates the reading control on a work that is not currently-reading
- **THEN** the system prompts for a start date, prefilled with today's date computed from the browser's local date, and an optional format

#### Scenario: Confirming a start date
- **WHEN** a signed-in user confirms the start-reading prompt with a start date
- **THEN** the work becomes currently-reading and its start date is set to the confirmed date

#### Scenario: Adjusting the prefilled start date
- **WHEN** a signed-in user changes the prefilled start date before confirming
- **THEN** the work's start date is set to the user-chosen date, not the prefilled default

#### Scenario: Confirming with a format supplied
- **WHEN** a signed-in user confirms the start-reading prompt with a format supplied
- **THEN** the work's current reading session records that format

#### Scenario: Confirming with no format supplied
- **WHEN** a signed-in user confirms the start-reading prompt with the format left blank
- **THEN** the work's current reading session records no format

#### Scenario: Starting to read a work that is already marked read
- **WHEN** a signed-in user activates the reading control on a work that is marked read but not currently-reading
- **THEN** the work becomes currently-reading, its read state remains true, and its existing logged reads are unchanged

### Requirement: User can finish a currently-reading work with an end date
The system SHALL let a signed-in user finish a King work that is currently-reading by supplying an end date, defaulted to the current date in the user's local timezone and adjustable before confirming, along with an optional note, format, and rating. The format field SHALL be prefilled with the format captured when this reading session was started, if any, and remains adjustable before confirming. Finishing SHALL mark the work as read, SHALL NOT change its previously recorded start date, and SHALL create a new logged read record capturing the end date and any supplied note, format, and rating.

#### Scenario: Opening the finish prompt
- **WHEN** a signed-in user activates the reading control on a work that is currently-reading
- **THEN** the system prompts for an end date, prefilled with today's date computed from the browser's local date, along with optional note, format, and rating fields

#### Scenario: Finish prompt prefills the format from the reading session
- **WHEN** a signed-in user opens the finish prompt for a work whose current reading session has a format captured
- **THEN** the format field is prefilled with that format

#### Scenario: Adjusting the prefilled format
- **WHEN** a signed-in user changes the prefilled format before confirming the finish prompt
- **THEN** the created logged read stores the user-chosen format, not the prefilled one

#### Scenario: Confirming an end date
- **WHEN** a signed-in user confirms the finish prompt with an end date
- **THEN** the work becomes read, its finish date is set to the confirmed date, its start date is unchanged, and a new logged read is created for the confirmed end date

#### Scenario: Confirming a finish with logged details
- **WHEN** a signed-in user confirms the finish prompt with a note, format, and rating supplied
- **THEN** the created logged read stores the confirmed end date along with the supplied note, format, and rating

### Requirement: User can mark a work as read directly, with optional dates
The system SHALL let a signed-in user mark a King work as read without first marking it currently-reading, via a prompt offering a start date, an end date, a year, a note, a format, and a rating, all optional and independently skippable. Confirming SHALL mark the work as read and SHALL create a new logged read record capturing whichever of these fields were supplied.

#### Scenario: Marking read with no dates supplied
- **WHEN** a signed-in user confirms the mark-as-read prompt with the start date, end date, and year all left blank
- **THEN** the work becomes read with its start date, finish date, and year all left unset, and a logged read is created with no dates

#### Scenario: Marking read with a full date range
- **WHEN** a signed-in user confirms the mark-as-read prompt with both a start date and an end date supplied
- **THEN** the work becomes read with its start date and finish date set to the supplied values, and a logged read is created capturing those dates

#### Scenario: Marking read with only a year
- **WHEN** a signed-in user confirms the mark-as-read prompt with only a year supplied
- **THEN** the work becomes read with its year set to the supplied value and its start date and finish date left unset, and a logged read is created capturing that year

#### Scenario: Marking read with logged details
- **WHEN** a signed-in user confirms the mark-as-read prompt with a note, format, and rating all supplied
- **THEN** the work becomes read and the created logged read stores the supplied note, format, and rating alongside any supplied dates

### Requirement: User can mark a work as read again after it has already been read
The system SHALL let a signed-in user who has a King work marked read create an additional logged read for that work, via the same optional prompt (start date, end date, year, note, format, rating) used for marking read directly, without needing to unmark the work first. Each confirmed read-again action SHALL create a new, distinct logged read record and SHALL NOT alter or remove any previously logged read for that work. The work SHALL remain marked read throughout.

#### Scenario: Opening the read-again prompt
- **WHEN** a signed-in user activates the read-again control on a work marked read
- **THEN** the system prompts for the same optional fields (dates, note, format, rating) as marking read directly

#### Scenario: Confirming a read-again logs a new read
- **WHEN** a signed-in user confirms the read-again prompt
- **THEN** a new logged read record is created for that work in addition to any existing logged reads, and the work remains marked read

#### Scenario: Read-again does not modify prior logged reads
- **WHEN** a signed-in user logs a read-again for a work that already has one or more logged reads
- **THEN** those existing logged read records are unchanged

### Requirement: Each logged read can capture a note, format, and personal rating
The system SHALL let a signed-in user optionally attach the following to any read-completing action (finishing a currently-reading work, marking read directly, or reading again): a note of at most 200 characters, a format (one of physical, audiobook, or ebook), and a personal rating from 1 to 5 stars. Each field SHALL be independently skippable. These details SHALL be stored against that specific logged read, not against the work as a whole.

#### Scenario: Logging a read with all optional details supplied
- **WHEN** a signed-in user completes a read-completing action with a note, a format, and a rating all supplied
- **THEN** the resulting logged read stores the supplied note, format, and rating

#### Scenario: Logging a read with no optional details supplied
- **WHEN** a signed-in user completes a read-completing action with the note, format, and rating all left blank
- **THEN** the resulting logged read is created with no note, no format, and no rating

#### Scenario: A note over the length limit is rejected
- **WHEN** a signed-in user enters a note longer than 200 characters on a read-completing action
- **THEN** the system does not accept the note as entered and the user must shorten it before confirming

#### Scenario: Two logged reads for the same work have independent details
- **WHEN** a signed-in user has logged two separate reads of the same King work with different notes, formats, or ratings
- **THEN** each logged read displays only its own note, format, and rating

### Requirement: User can unmark a work as read, deleting its logged reads, after confirming
The system SHALL let a signed-in user unmark a King work that is read only after they explicitly confirm the action. Upon confirmation, the system SHALL delete every logged read recorded for that work, clear its start date, finish date, and year, and set its read state to false. Canceling the confirmation SHALL leave the work's read state, logged reads, and dates unchanged.

#### Scenario: Opening the unmark confirmation
- **WHEN** a signed-in user activates the unmark-read control on a work that is read
- **THEN** the system asks them to confirm before making any change

#### Scenario: Confirming deletes all logged reads
- **WHEN** a signed-in user confirms unmarking a work that has one or more logged reads
- **THEN** all of that work's logged reads are deleted, its read state becomes false, and its start date, finish date, and year are cleared

#### Scenario: Canceling leaves everything unchanged
- **WHEN** a signed-in user cancels the unmark confirmation instead of confirming it
- **THEN** the work's read state, logged reads, start date, finish date, and year all remain exactly as they were

#### Scenario: Unmarking does not restore want-to-read
- **WHEN** a signed-in user confirms unmarking a work as read
- **THEN** the work's want-to-read state remains false

### Requirement: Reading-status writes never need to enforce state invariants client-side
The system SHALL rely on server-enforced invariants for reading-status transitions, rather than duplicating that logic in the client: setting currently-reading true clears want-to-read; completing a read (finishing, marking read directly, or reading again) clears want-to-read and ends any currently-reading session, regardless of whether the work was already marked read before that session started. Currently-reading and read MAY be true at the same time - a work that is already read can be started again (see "User can start reading a work with a start date"), and stays read throughout that new session.

#### Scenario: Starting a want-to-read work clears want-to-read
- **WHEN** a signed-in user starts reading a work that was marked want-to-read
- **THEN** the work's want-to-read state becomes false and its currently-reading state becomes true

#### Scenario: Marking a currently-reading work as read clears currently-reading
- **WHEN** a signed-in user finishes a work that was currently-reading
- **THEN** the work's currently-reading state becomes false and its read state becomes true

#### Scenario: Finishing a reread that started after the work was already read
- **WHEN** a signed-in user finishes reading a work that was already marked read before this reading session started
- **THEN** the work's currently-reading state becomes false, a new logged read is created for this session, and its read state remains true

### Requirement: Reading status controls support an expanded display mode
The system SHALL support presenting a work's reading-status controls in an expanded display mode, in which every action available for the work's current reading state (per the requirements above) is shown as its own separately activatable control, rather than one primary action with the rest grouped behind a single secondary control. The expanded mode SHALL make available exactly the same actions, with exactly the same effects, as the existing compact presentation for the same reading state.

#### Scenario: Neutral state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work with no reading-status record
- **THEN** separate controls are shown for want-to-read, start-reading, and mark-as-read

#### Scenario: Want-to-read state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked want-to-read
- **THEN** separate controls are shown for removing want-to-read, starting to read, and marking as read

#### Scenario: Currently-reading state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked currently-reading, whether or not it is also marked read
- **THEN** separate controls are shown for finishing the work and marking it as read directly

#### Scenario: Read state in expanded mode
- **WHEN** a signed-in user views the expanded reading-status controls for a work marked read and not currently-reading
- **THEN** separate controls are shown for unmarking it as read, for reading it again, and for starting to read it

#### Scenario: Activating an expanded-mode control
- **WHEN** a signed-in user activates any control shown in the expanded display mode
- **THEN** it has the same effect on the work's reading status as activating the equivalent action in the compact presentation

### Requirement: Works by Others share the same reading-status controls
The system SHALL use the same reading-status components for a By Other Hands work as for a King work - the same compact and expanded control layouts, the same start-reading/mark-as-read/edit-dates prompts (including the note, format, and rating fields), and the same reading timeline - each backed by the domain's own table (`user_related_works` for a By Other Hands work, instead of `user_books`/`user_book_reads`), rather than separate, duplicated components per domain. Where a By Other Hands work genuinely has no equivalent of a King capability, that capability SHALL be omitted rather than shown non-functional: no Read Again (no reread-history table - a single mark-as-read record instead covers marking read directly, finishing an in-progress read, and editing an already-read entry), and no confirmation step before unmarking as read (nothing to lose - a single flat record, not a log of logged reads, is reset in place).

#### Scenario: Starting, finishing, and marking a By Other Hands work read
- **WHEN** a signed-in user starts reading, finishes, or marks as read directly a By Other Hands work
- **THEN** the same prompts used for a King work appear, including the format field, and record the action against that work's own `user_related_works` row

#### Scenario: No Read Again for a By Other Hands work
- **WHEN** a signed-in user views the expanded reading-status controls for a By Other Hands work marked read and not currently-reading
- **THEN** only a control for starting to read it again is shown, not a separate Read Again control

#### Scenario: Unmarking a By Other Hands work as read needs no confirmation
- **WHEN** a signed-in user unmarks a By Other Hands work as read
- **THEN** it is unmarked immediately, without a confirmation step

#### Scenario: A By Other Hands read can be edited from the reading timeline
- **WHEN** the profile owner activates the edit-dates control on a By Other Hands entry in their reading timeline
- **THEN** they can update that read's dates, note, rating, and format, the same as they can for a King entry
