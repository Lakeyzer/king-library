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

### Requirement: Reading Timeline entries link to their work's detail page
The system SHALL make each logged read shown on a Reading Timeline page a link to its King work's detail page.

#### Scenario: Following a Reading Timeline entry
- **WHEN** a visitor selects a logged read shown on a Reading Timeline page
- **THEN** they are taken to that work's detail page

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
