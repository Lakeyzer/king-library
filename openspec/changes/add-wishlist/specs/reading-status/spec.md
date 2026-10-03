## REMOVED Requirements

### Requirement: Works by Others share every reading-status control except the wishlist
**Reason**: Works by Others now have a wishlist, so the exception no longer applies. Replaced by "Works by Others share every reading-status control" below, which is the same requirement with the wishlist included.
**Migration**: None needed. Every other shared control is unchanged, and By Other Hands works gain the wishlist control.

## ADDED Requirements

### Requirement: Works by Others share every reading-status control
The system SHALL use the same reading-status components for a By Other Hands work as for a King work. That covers:
- the same compact and expanded control layouts
- the same start-reading, finish, stop-reading, mark-as-read, Read Again, and edit-dates prompts (including the note, format, and rating fields)
- the same confirm-before-unmark flow
- the same reading timeline
- the same wishlist control (see the wishlist capability)

Both kinds of work are backed by the same per-user tracking and logged-read history, rather than separate, duplicated components or storage per kind.

#### Scenario: Starting, finishing, stopping, and marking a By Other Hands work read
- **WHEN** a signed-in user starts reading, finishes, stops reading, or marks as read directly a By Other Hands work
- **THEN** the same prompts used for a King work appear, including the format field, and record the action the same way they would for a King work

#### Scenario: Read Again is offered for a By Other Hands work
- **WHEN** a signed-in user views the expanded reading-status controls for a By Other Hands work marked read and not currently-reading
- **THEN** a Read Again control is shown, the same as for a read King work, and using it logs an additional read without removing the earlier one

#### Scenario: Unmarking a By Other Hands work as read asks for confirmation
- **WHEN** a signed-in user unmarks a By Other Hands work as read
- **THEN** they are asked to confirm first, the same as for a King work, and confirming deletes that work's logged reads

#### Scenario: Stopping a reread of a By Other Hands work restores the earlier read's dates
- **WHEN** a signed-in user stops an in-progress reread of a By Other Hands work that was already read
- **THEN** the work stays read, and its summary start and finish dates return to those of its most recent logged read

#### Scenario: A By Other Hands read can be edited from the reading timeline
- **WHEN** the profile owner activates the edit-dates control on a By Other Hands entry in their reading timeline
- **THEN** they can update that read's dates, note, rating, and format, the same as they can for a King entry

#### Scenario: Wishlist control for a By Other Hands work
- **WHEN** a signed-in user views the reading-status or collection controls for a By Other Hands work
- **THEN** the same wishlist control shown for a King work is shown
