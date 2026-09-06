# profile-showcase Specification

## Purpose

Gives every user a flashy, shareable dashboard of their Stephen King reading and viewing achievements — reading progress by category, adaptation viewing progress, what they're currently reading, and how much of the bibliography they own.

## Requirements

### Requirement: Own showcase requires sign-in and a username
The system SHALL only allow a signed-in user with a username set to view their own showcase, redirecting a signed-out visitor to sign in and a signed-in user without a username to onboarding, consistent with how the account settings page is gated.

#### Scenario: Signed-out visitor tries to view their own showcase
- **WHEN** a signed-out visitor navigates to their own showcase page
- **THEN** they are not shown dashboard content and are directed to sign in

#### Scenario: Signed-in user without a username tries to view their own showcase
- **WHEN** a signed-in user with no username set navigates to their own showcase page
- **THEN** they are redirected to the onboarding page instead of seeing the dashboard

### Requirement: Showcase reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's showcase by that user's username when the profile is public.

#### Scenario: A signed-in user views another public profile's showcase
- **WHEN** a signed-in user navigates to the showcase of another user whose profile is public
- **THEN** they see that user's dashboard

#### Scenario: A signed-out visitor views a public profile's showcase
- **WHEN** a signed-out visitor navigates to the showcase of a user whose profile is public
- **THEN** they see that user's dashboard without being asked to sign in

#### Scenario: Requesting a username that matches no profile
- **WHEN** a visitor navigates to a showcase URL for a username that matches no profile
- **THEN** they receive an indication that no such profile exists

### Requirement: Private profile hides showcase data from other visitors
The system SHALL show a "this profile is private" state, instead of the dashboard, to any visitor who is not the profile's owner when that profile is private.

#### Scenario: Visiting another user's private showcase
- **WHEN** a visitor who is not the profile owner navigates to the showcase of a user whose profile is private
- **THEN** they see a "this profile is private" state instead of reading/viewing/collection data

#### Scenario: Owner viewing their own private showcase by username
- **WHEN** the profile owner navigates to their own showcase (whether at their own dashboard or by their own username) while their profile is private
- **THEN** they see their full dashboard, not the private notice

### Requirement: Reading progress bars for overall, Bachman, and Dark Tower
The system SHALL display, on a showcase, three reading-progress indicators: overall progress (the profile owner's count of King works marked read out of all King works), Bachman progress (count of Bachman-flagged King works marked read out of all Bachman-flagged King works), and Dark Tower progress (count of Dark-Tower-flagged King works marked read out of all Dark-Tower-flagged King works).

#### Scenario: Overall progress reflects total read count
- **WHEN** a showcase is displayed for a profile owner who has marked some King works read
- **THEN** the overall progress indicator shows their read count out of the total number of King works

#### Scenario: Bachman progress counts only Bachman-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Bachman progress indicator's read count and total are both restricted to King works with the Bachman flag set

#### Scenario: Dark Tower progress counts only Dark-Tower-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Dark Tower progress indicator's read count and total are both restricted to King works with the Dark Tower flag set

### Requirement: Adaptation viewing progress
The system SHALL display, on a showcase, a viewing-progress indicator showing the profile owner's count of adaptations marked watched out of the total number of adaptations.

#### Scenario: Viewing progress reflects watched count
- **WHEN** a showcase is displayed for a profile owner who has marked some adaptations watched
- **THEN** the viewing-progress indicator shows their watched count out of the total number of adaptations

### Requirement: Currently Reading section shows in-progress works
The system SHALL display, on a showcase, cover art for every King work the profile owner currently has marked currently-reading, and SHALL display an empty state when none are currently-reading.

#### Scenario: One work currently reading
- **WHEN** a showcase is displayed for a profile owner with exactly one King work marked currently-reading
- **THEN** the Currently Reading section shows that work's cover art

#### Scenario: Multiple works currently reading
- **WHEN** a showcase is displayed for a profile owner with more than one King work marked currently-reading
- **THEN** the Currently Reading section shows cover art for all of them

#### Scenario: No works currently reading
- **WHEN** a showcase is displayed for a profile owner with no King work marked currently-reading
- **THEN** the Currently Reading section shows an empty state instead of any cover art

### Requirement: Collection progress is a non-interactive placeholder
The system SHALL display, on a showcase, a collection-progress indicator showing the profile owner's count of King works marked owned out of the total number of King works, and SHALL NOT navigate anywhere when activated, since no bookshelf feature exists yet.

#### Scenario: Collection progress reflects owned count
- **WHEN** a showcase is displayed for a profile owner who has marked some King works owned
- **THEN** the collection-progress indicator shows their owned count out of the total number of King works

#### Scenario: Collection progress does not navigate
- **WHEN** a visitor activates the collection-progress indicator
- **THEN** no navigation occurs, since the bookshelf feature it will eventually link to does not exist yet

### Requirement: Currently Reading items support finishing directly from the showcase
The system SHALL let the profile owner finish a King work shown in the Currently Reading section directly from the showcase, using the same finish-reading flow (an end date, defaulted to today and adjustable) defined by the reading-status capability, without navigating away from the showcase. The system SHALL NOT show this action to a visitor who is not the profile owner.

#### Scenario: Finishing a currently-reading work from the showcase
- **WHEN** the profile owner activates the finish action on a work in their Currently Reading section
- **THEN** they are prompted for an end date the same way as elsewhere in the app, and confirming it marks that work as read and removes it from the Currently Reading section

#### Scenario: Visitor viewing another user's showcase does not see a finish action
- **WHEN** a visitor who is not the profile owner views that profile's Currently Reading section
- **THEN** no finish action is shown for any item
