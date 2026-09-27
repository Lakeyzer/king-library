## ADDED Requirements

### Requirement: Admins can respond to a suggestion
The system SHALL let an admin write, edit, or clear a single response on any suggestion, using a control shown in that suggestion's expanded body on the Suggestion Box page. A response SHALL be non-blank and at most 1000 characters. Saving an empty response SHALL clear it. The system SHALL NOT show this control, or allow this change, to a signed-in user who is not an admin.

#### Scenario: Admin writes a response
- **WHEN** an admin expands a suggestion, enters a response, and saves it
- **THEN** the response is stored on the suggestion and shown in its expanded body

#### Scenario: Admin edits an existing response
- **WHEN** an admin changes the text of an existing response and saves it
- **THEN** the suggestion shows the updated response

#### Scenario: Admin clears a response
- **WHEN** an admin empties the response field and saves it
- **THEN** the suggestion no longer shows a response

#### Scenario: Response over the length limit
- **WHEN** an admin tries to save a response longer than 1000 characters
- **THEN** it is rejected and the admin is shown that the response is too long

#### Scenario: Non-admin has no response control
- **WHEN** a signed-in user who is not an admin expands a suggestion
- **THEN** they have no control to write, edit, or clear its response

### Requirement: Admin responses are visible to every signed-in user
The system SHALL show a suggestion's admin response to every signed-in user in that suggestion's expanded body. It SHALL be visually set apart from the suggestion's own body, labeled as an admin response, and show when it was last updated. A suggestion that has a response SHALL show a marker in its collapsed row, so users can tell there is a response before expanding it.

#### Scenario: Viewing a suggestion with a response
- **WHEN** a signed-in user expands a suggestion that has an admin response
- **THEN** they see the response below the suggestion body, labeled as an admin response, with when it was last updated

#### Scenario: Spotting a response in the collapsed list
- **WHEN** a signed-in user views the suggestion list
- **THEN** each suggestion with an admin response shows a marker in its collapsed row
