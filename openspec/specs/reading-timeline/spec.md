# reading-timeline Specification

## Purpose

Gives every user a dedicated, full page for their reading timeline - every logged read, in a vertical layout, including personal ratings - reachable both as the signed-in user's own shortcut and by username for viewing anyone's public timeline.

## Requirements

### Requirement: Own Reading Timeline page requires sign-in
The system SHALL only allow a signed-in user to view their own Reading Timeline page, redirecting a signed-out visitor to sign in.

#### Scenario: Signed-out visitor tries to view their own Reading Timeline page
- **WHEN** a signed-out visitor navigates to their own Reading Timeline page
- **THEN** they are not shown any logged reads and are directed to sign in

### Requirement: Reading Timeline page shows its owner's logged reads in a vertical layout
The system SHALL display, on a Reading Timeline page, every logged read belonging to the page's owner in a vertical timeline layout, ordered most-recent first, and SHALL display an empty state when the owner has none. Each entry SHALL show the personal rating and format (with an icon representing it) captured for that logged read, to any visitor. The note captured for a logged read is personal and SHALL be shown only to the page's owner, never to another visitor, even when the profile is public.

#### Scenario: Owner has logged reads
- **WHEN** a Reading Timeline page is displayed for an owner with one or more logged reads
- **THEN** the page shows every logged read, ordered most-recent first, in a vertical layout

#### Scenario: Owner has no logged reads
- **WHEN** a Reading Timeline page is displayed for an owner with no logged reads
- **THEN** the page shows an empty state instead of any entries

#### Scenario: Entries show personal ratings
- **WHEN** a Reading Timeline page displays a logged read that has a personal rating
- **THEN** that entry shows the rating

#### Scenario: Entries show format with an icon
- **WHEN** a Reading Timeline page displays a logged read that has a format captured
- **THEN** that entry shows an icon representing that format alongside its label

#### Scenario: Owner sees their own notes
- **WHEN** the page's owner views their own Reading Timeline and a logged read has a note
- **THEN** that entry shows the note

#### Scenario: A visitor does not see another owner's notes
- **WHEN** a visitor who is not the page's owner views a Reading Timeline page and a logged read has a note
- **THEN** that entry does not show the note, even though the profile is public

### Requirement: Owner can add a logged read from the Reading Timeline page via search
The system SHALL let the Reading Timeline page's signed-in owner open a search dialog listing active King works, filterable by title, and select one to open the same mark-as-read prompt used elsewhere in the app (see reading-status "User can mark a work as read directly, with optional dates") for that work. The system SHALL NOT show this control to a visitor who is not the page's owner.

#### Scenario: Opening the search dialog
- **WHEN** the page's owner activates the Add to Timeline control
- **THEN** a dialog appears letting them search active King works by title

#### Scenario: Selecting a work opens the mark-as-read prompt
- **WHEN** the owner selects a work from the search results
- **THEN** the system opens the same mark-as-read prompt used elsewhere in the app for that work

#### Scenario: A newly logged read appears on the page
- **WHEN** the owner confirms the mark-as-read prompt after selecting a work via search
- **THEN** a new entry for that logged read appears on the Reading Timeline page

#### Scenario: Non-owner sees no add control
- **WHEN** a visitor who is not the page's owner views a Reading Timeline page
- **THEN** no Add to Timeline control is shown

### Requirement: Owner can delete a logged read from its edit prompt
The system SHALL let the signed-in owner of a logged read permanently delete that entry from a Delete control in the footer of its edit prompt (the same prompt opened via the entry's date-editing control), after confirming - a second activation of the same control within a short window, rather than a separate confirmation dialog. Deleting a King work's logged read removes only that one entry, leaving any other logged reads for the same work untouched; if the deleted entry was the work's most-recently-read one, the work's summary (its most recent start/finish date, shown elsewhere in the app) SHALL update to the next-most-recent remaining read, or revert to unread if none remain. A By Other Hands work has only one entry per work (see "Reading Timeline includes Works by Others reads"), so deleting it is equivalent to unmarking that work as read. The system SHALL NOT show this control to anyone other than the entry's owner.

#### Scenario: Deleting a King work's only logged read
- **WHEN** the owner deletes a King work's only logged read
- **THEN** that entry no longer appears on the Reading Timeline, and the work reverts to unread

#### Scenario: Deleting one of several logged reads for the same King work
- **WHEN** the owner deletes one of several logged reads for the same King work
- **THEN** only that entry is removed, the work's other logged reads remain, and the work stays marked read

#### Scenario: Deleting the most recent of several logged reads updates the summary
- **WHEN** the owner deletes a King work's most-recently-read logged read, and other logged reads remain for that work
- **THEN** the work's summary reflects whichever remaining logged read is now most recent

#### Scenario: Deleting a By Other Hands entry
- **WHEN** the owner deletes a By Other Hands work's logged read
- **THEN** that entry no longer appears on the Reading Timeline, and the work reverts to unread

#### Scenario: Confirming a delete
- **WHEN** the owner activates Delete once, then activates it again within the confirmation window
- **THEN** the entry is deleted

#### Scenario: Not confirming a delete
- **WHEN** the owner activates Delete once and does not activate it again before the confirmation window elapses
- **THEN** the entry is not deleted, and a further activation is treated as a fresh first click

### Requirement: Reading Timeline entries link to their work's detail page
The system SHALL make each logged read shown on a Reading Timeline page a link to its work's detail page - a King work's own detail page, or a Works by Others work's own detail page for one of those (see "Reading Timeline includes Works by Others reads" below).

#### Scenario: Following a Reading Timeline entry
- **WHEN** a visitor selects a logged read shown on a Reading Timeline page
- **THEN** they are taken to that work's detail page

### Requirement: Reading Timeline includes Works by Others reads
The system SHALL include, alongside King works, every Works by Others work the page's owner has read, ordered together with King reads by the same most-recent-first rule, and SHALL let the owner edit a Works by Others entry's dates, note, and rating the same as a King entry (see reading-status's "Works by Others share the same reading-status controls" for why this edits the work's single `user_related_works` row rather than a per-read log entry). A Works by Others entry SHALL NOT appear here for a work only marked read as part of an omnibus cascading onto it (see the by-other-hands capability) - only a work read on its own or explicitly marked read directly.

#### Scenario: A Works by Others read appears on the timeline
- **WHEN** the page's owner has read a Works by Others work
- **THEN** the Reading Timeline page shows an entry for that read, ordered alongside King reads by date

#### Scenario: Owner can edit a Works by Others entry
- **WHEN** the page's owner activates the edit-dates control on a Works by Others entry
- **THEN** they can update that read's dates, note, and rating, the same as they can for a King entry

#### Scenario: A cascaded omnibus component is not shown separately
- **WHEN** the page's owner marks a Works by Others omnibus read, cascading read status onto the individual works it collects
- **THEN** only the omnibus itself appears as a Reading Timeline entry, not the works it collects

### Requirement: Reading Timeline reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's Reading Timeline page by that user's username when the profile is public.

#### Scenario: A visitor views another public profile's Reading Timeline
- **WHEN** a visitor navigates to the Reading Timeline page of a user whose profile is public
- **THEN** they see that user's logged reads

#### Scenario: A signed-out visitor views a public profile's Reading Timeline
- **WHEN** a signed-out visitor navigates to the Reading Timeline page of a user whose profile is public
- **THEN** they see that user's logged reads without being asked to sign in

### Requirement: Private profile hides Reading Timeline from other visitors
The system SHALL show a "this profile is private" state, instead of the timeline, to any visitor who is not the Reading Timeline page's owner when that profile is private.

#### Scenario: Visiting another user's private Reading Timeline
- **WHEN** a visitor who is not the profile owner navigates to the Reading Timeline page of a user whose profile is private
- **THEN** they see a "this profile is private" state instead of any logged reads

#### Scenario: Owner viewing their own private Reading Timeline by username
- **WHEN** the profile owner navigates to their own Reading Timeline page by their own username while their profile is private
- **THEN** they see their full timeline, not the private notice
