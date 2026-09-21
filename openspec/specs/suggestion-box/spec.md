# suggestion-box Specification

## Purpose

Lets signed-in users submit suggestions for the app and browse what others have suggested, giving the project a built-in feedback channel.

## Requirements

### Requirement: Suggestion Box page requires sign-in
The system SHALL only allow a signed-in user to view the Suggestion Box page, redirecting a signed-out visitor to sign in.

#### Scenario: Signed-out visitor tries to view the Suggestion Box page
- **WHEN** a signed-out visitor navigates to the Suggestion Box page
- **THEN** they are not shown any suggestions and are directed to sign in

#### Scenario: Signed-in user views the Suggestion Box page
- **WHEN** a signed-in user navigates to the Suggestion Box page
- **THEN** they see the list of submitted suggestions

### Requirement: Suggestion Box page lists suggestions, paginated
The system SHALL display submitted suggestions matching the active status filter (per "Suggestion list can be filtered by status" below) on the Suggestion Box page, paginated, ordered per the active sort (per "Suggestion list is sortable" below), defaulting to most recent first. Each listed suggestion SHALL show its title, its author's identity (per "Suggestion author display" below), its status (per "Suggestion status" below), and its vote counts (per "Suggestion voting" below) by default, with its body text collapsed until the user expands that suggestion.

#### Scenario: Viewing the suggestion list
- **WHEN** a signed-in user views the Suggestion Box page
- **THEN** they see submitted suggestions with their titles, authors, statuses, and vote counts, split across pages, each suggestion's body collapsed

#### Scenario: Expanding a suggestion
- **WHEN** a signed-in user expands a suggestion in the list
- **THEN** that suggestion's body text is revealed

#### Scenario: Navigating to a further page of suggestions
- **WHEN** a signed-in user selects a subsequent page of the suggestion list
- **THEN** the next set of suggestions is displayed

### Requirement: Only signed-in users can create a suggestion
The system SHALL only allow a signed-in user to open the suggestion-creation modal and submit a new suggestion.

#### Scenario: Signed-in user opens the creation modal
- **WHEN** a signed-in user activates the "New Suggestion" control
- **THEN** a modal opens with a title input and a suggestion body textarea

#### Scenario: Signed-out visitor has no way to create a suggestion
- **WHEN** a signed-out visitor views the Suggestion Box page or footer
- **THEN** no control to create a new suggestion is available to them

### Requirement: Suggestion requires a title and body, within length limits
The system SHALL require both a non-empty title and a non-empty suggestion body before a suggestion can be submitted. The title SHALL be at most 100 characters and the body SHALL be at most 1000 characters.

#### Scenario: Submitting with a missing field
- **WHEN** a signed-in user attempts to submit the suggestion form with an empty title or an empty body
- **THEN** the submission is rejected and the user is shown which field is missing

#### Scenario: Submitting with a field over its length limit
- **WHEN** a signed-in user attempts to submit the suggestion form with a title over 100 characters or a body over 1000 characters
- **THEN** the submission is rejected and the user is shown which field is too long

#### Scenario: Submitting with both fields filled and within limits
- **WHEN** a signed-in user submits the suggestion form with a title and a body, each within their length limit
- **THEN** the suggestion is created and appears in the suggestion list

### Requirement: Suggestion author display
The system SHALL let a user submitting a suggestion choose to post it under their username or anonymously. The submitting user's identity SHALL always be recorded on the suggestion regardless of this choice, but the list SHALL display "Anonymous" instead of the username for a suggestion posted anonymously.

#### Scenario: Posting under a username
- **WHEN** a signed-in user submits a suggestion without choosing to post anonymously
- **THEN** the suggestion is shown in the list with that user's username attached

#### Scenario: Posting anonymously
- **WHEN** a signed-in user submits a suggestion with the anonymous option chosen
- **THEN** the suggestion is shown in the list with "Anonymous" in place of a username

### Requirement: Suggestion status
Every suggestion SHALL have a status of `new`, `rejected`, `confirmed`, or `applied`, set to `new` when the suggestion is created. The status SHALL be visible to every signed-in user viewing the suggestion list.

#### Scenario: New suggestion starts as "new"
- **WHEN** a signed-in user submits a suggestion
- **THEN** it appears in the list with a status of "new"

#### Scenario: Status is visible to any signed-in user
- **WHEN** a signed-in user views the suggestion list
- **THEN** each suggestion shows its current status

### Requirement: Only admins can change a suggestion's status
The system SHALL let an admin change a suggestion's status to any of `new`, `rejected`, `confirmed`, or `applied`, via a control shown inline on the Suggestion Box page. The system SHALL NOT show this control, or allow this change, to a signed-in user who is not an admin.

#### Scenario: Admin changes a suggestion's status
- **WHEN** an admin selects a different status for a suggestion
- **THEN** the suggestion's status updates and the new status is reflected in the list

#### Scenario: Non-admin has no status control
- **WHEN** a signed-in user who is not an admin views the suggestion list
- **THEN** they see each suggestion's status but have no control to change it

### Requirement: Suggestion list can be filtered by status
The system SHALL let a signed-in user filter the suggestion list by status (`new`, `rejected`, `confirmed`, `applied`, or an option showing every status), and SHALL default this filter to `new` on page load.

#### Scenario: Default page load shows only new suggestions
- **WHEN** a signed-in user navigates to the Suggestion Box page
- **THEN** only suggestions with status "new" are shown

#### Scenario: Changing the status filter
- **WHEN** a signed-in user selects a different status filter, or the "all" option
- **THEN** the list updates to show only suggestions matching that status, or every suggestion regardless of status

### Requirement: Suggestion Box page encourages checking for existing suggestions first
The system SHALL display a message on the Suggestion Box page asking visitors to look through existing suggestions before submitting a new one.

#### Scenario: Viewing the Suggestion Box page
- **WHEN** a signed-in user views the Suggestion Box page
- **THEN** they see a message encouraging them to check whether their idea has already been suggested before submitting a new one

### Requirement: Suggestion voting
The system SHALL let any signed-in user cast a thumbs-up or thumbs-down vote on a suggestion whose status is "new", at most one vote per user per suggestion. The list SHALL show each suggestion's vote counts and, to the voting user, which direction (if any) they have voted, regardless of the suggestion's status.

#### Scenario: Casting a first vote
- **WHEN** a signed-in user who has not yet voted on a suggestion with status "new" selects thumbs-up or thumbs-down for it
- **THEN** their vote is recorded, the suggestion's vote counts update, and their chosen direction is highlighted

#### Scenario: A user's vote is visible only to them as their own state
- **WHEN** a signed-in user views a suggestion they have voted on
- **THEN** they see which direction they voted, alongside the suggestion's overall vote counts

### Requirement: Changing or undoing a vote
The system SHALL let a signed-in user change their existing vote on a suggestion whose status is "new" to the opposite direction, and SHALL let them undo their vote entirely by selecting the same direction they already voted, while that suggestion's status is "new".

#### Scenario: Changing vote direction
- **WHEN** a signed-in user who has voted thumbs-up on a suggestion with status "new" selects thumbs-down for it
- **THEN** their vote changes to thumbs-down and the suggestion's vote counts update accordingly

#### Scenario: Undoing a vote
- **WHEN** a signed-in user selects the same direction they already voted for a suggestion with status "new"
- **THEN** their vote is removed and the suggestion's vote counts update accordingly

### Requirement: Voting closes once a suggestion is no longer "new"
The system SHALL NOT allow casting, changing, or undoing a vote on a suggestion whose status is not "new". Vote counts and the visitor's own prior vote (if any) SHALL remain visible regardless of status.

#### Scenario: Vote controls are disabled once triaged
- **WHEN** a signed-in user views a suggestion whose status is "rejected", "confirmed", or "applied"
- **THEN** the vote controls are disabled while the suggestion's vote counts and their own prior vote (if any) remain visible

#### Scenario: A suggestion's existing votes survive triage
- **WHEN** an admin changes a suggestion's status away from "new"
- **THEN** its existing vote counts are unchanged and remain visible in the list

### Requirement: Suggestion list is sortable
The system SHALL let a signed-in user sort the suggestion list by "Newest" (creation date, most recent first) or "Most Popular" (net votes - upvotes minus downvotes - highest first), defaulting to "Newest" on page load.

#### Scenario: Default page load sorts by newest
- **WHEN** a signed-in user navigates to the Suggestion Box page
- **THEN** suggestions are ordered by creation date, most recent first

#### Scenario: Sorting by most popular
- **WHEN** a signed-in user selects the "Most Popular" sort option
- **THEN** suggestions are reordered by net votes, highest first

### Requirement: Only admins can delete a suggestion
The system SHALL let an admin permanently delete a suggestion, after a confirmation step, via a control shown inline on the Suggestion Box page. The system SHALL NOT show this control, or allow this action, to a signed-in user who is not an admin.

#### Scenario: Admin deletes a suggestion
- **WHEN** an admin confirms deleting a suggestion
- **THEN** the suggestion is permanently removed and no longer appears in the list

#### Scenario: Admin cancels a deletion
- **WHEN** an admin starts deleting a suggestion but does not confirm
- **THEN** the suggestion is not deleted and remains in the list

#### Scenario: Non-admin has no delete control
- **WHEN** a signed-in user who is not an admin views the suggestion list
- **THEN** they have no control to delete a suggestion
