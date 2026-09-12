## Purpose

Gives every user a dedicated page listing the King works they want to read, separate from the summarized progress shown on their showcase, reachable both as the signed-in user's own shortcut and by username for viewing anyone's public list.

## ADDED Requirements

### Requirement: Own Read List page requires sign-in
The system SHALL only allow a signed-in user to view their own Read List page, redirecting a signed-out visitor to sign in.

#### Scenario: Signed-out visitor tries to view their own Read List page
- **WHEN** a signed-out visitor navigates to their own Read List page
- **THEN** they are not shown any want-to-read works and are directed to sign in

### Requirement: Read List shows its owner's want-to-read King works
The system SHALL display, on a Read List page, every King work its owner has marked want-to-read, and SHALL display an empty state when they have marked none.

#### Scenario: Owner has want-to-read works
- **WHEN** a Read List is displayed for an owner with one or more King works marked want-to-read
- **THEN** the page shows every King work they've marked want-to-read

#### Scenario: Owner has nothing queued to read
- **WHEN** a Read List is displayed for an owner with no King works marked want-to-read
- **THEN** the page shows an empty state instead of any works

### Requirement: Read List items link to their work detail page
The system SHALL make each King work shown on a Read List a link to that work's detail page.

#### Scenario: Following a Read List item
- **WHEN** a visitor selects a work shown on a Read List
- **THEN** they are taken to that work's detail page

### Requirement: Read List reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's Read List by that user's username when the profile is public.

#### Scenario: A visitor views another public profile's Read List
- **WHEN** a visitor navigates to the Read List of a user whose profile is public
- **THEN** they see that user's want-to-read King works

#### Scenario: A signed-out visitor views a public profile's Read List
- **WHEN** a signed-out visitor navigates to the Read List of a user whose profile is public
- **THEN** they see that user's want-to-read King works without being asked to sign in

### Requirement: Private profile hides Read List from other visitors
The system SHALL show a "this profile is private" state, instead of the list, to any visitor who is not the Read List's owner when that profile is private.

#### Scenario: Visiting another user's private Read List
- **WHEN** a visitor who is not the profile owner navigates to the Read List of a user whose profile is private
- **THEN** they see a "this profile is private" state instead of any want-to-read works

#### Scenario: Owner viewing their own private Read List by username
- **WHEN** the profile owner navigates to their own Read List by their own username while their profile is private
- **THEN** they see their full Read List, not the private notice
