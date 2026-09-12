# watch-list Specification

## Purpose

Gives every user a dedicated page listing the adaptations they want to watch, so their to-watch queue is browsable as its own page rather than only reflected in aggregate viewing progress, reachable both as the signed-in user's own shortcut and by username for viewing anyone's public list.

## Requirements

### Requirement: Own Watch List page requires sign-in
The system SHALL only allow a signed-in user to view their own Watch List page, redirecting a signed-out visitor to sign in.

#### Scenario: Signed-out visitor tries to view their own Watch List page
- **WHEN** a signed-out visitor navigates to their own Watch List page
- **THEN** they are not shown any want-to-watch adaptations and are directed to sign in

### Requirement: Watch List shows its owner's want-to-watch adaptations
The system SHALL display, on a Watch List page, every adaptation its owner has marked want-to-watch, and SHALL display an empty state when they have marked none.

#### Scenario: Owner has want-to-watch adaptations
- **WHEN** a Watch List is displayed for an owner with one or more adaptations marked want-to-watch
- **THEN** the page shows every adaptation they've marked want-to-watch

#### Scenario: Owner has nothing queued to watch
- **WHEN** a Watch List is displayed for an owner with no adaptations marked want-to-watch
- **THEN** the page shows an empty state instead of any adaptations

### Requirement: Watch List items link to their adaptation detail page
The system SHALL make each adaptation shown on a Watch List a link to that adaptation's detail page.

#### Scenario: Following a Watch List item
- **WHEN** a visitor selects an adaptation shown on a Watch List
- **THEN** they are taken to that adaptation's detail page

### Requirement: Watch List reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's Watch List by that user's username when the profile is public.

#### Scenario: A visitor views another public profile's Watch List
- **WHEN** a visitor navigates to the Watch List of a user whose profile is public
- **THEN** they see that user's want-to-watch adaptations

#### Scenario: A signed-out visitor views a public profile's Watch List
- **WHEN** a signed-out visitor navigates to the Watch List of a user whose profile is public
- **THEN** they see that user's want-to-watch adaptations without being asked to sign in

### Requirement: Private profile hides Watch List from other visitors
The system SHALL show a "this profile is private" state, instead of the list, to any visitor who is not the Watch List's owner when that profile is private.

#### Scenario: Visiting another user's private Watch List
- **WHEN** a visitor who is not the profile owner navigates to the Watch List of a user whose profile is private
- **THEN** they see a "this profile is private" state instead of any want-to-watch adaptations

#### Scenario: Owner viewing their own private Watch List by username
- **WHEN** the profile owner navigates to their own Watch List by their own username while their profile is private
- **THEN** they see their full Watch List, not the private notice
