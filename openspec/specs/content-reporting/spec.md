# content-reporting Specification

## Purpose

Lets a signed-in user flag a problem with a specific work, short story, adaptation, or by-other-hands item, or flag that something is missing from one of the canonical lists, so curators have a queue of user-sourced corrections to work from.

## Requirements

### Requirement: Report controls require sign-in
The system SHALL only allow a signed-in user to open a report-issue or report-missing-content form and submit a report. A signed-out visitor SHALL still see the report control, but activating it directs them to sign in rather than opening the form.

#### Scenario: Signed-in user opens a report form
- **WHEN** a signed-in user activates a "Report an issue" or "Report missing content" control
- **THEN** the corresponding report form opens

#### Scenario: Signed-out visitor activates a report control
- **WHEN** a signed-out visitor activates a "Report an issue" or "Report missing content" control
- **THEN** no form opens and they are directed to sign in

### Requirement: Detail pages offer a "Report an issue" control
Every content detail page - a work (`/works/[slug]`), a short story (`/short-works/[slug]`), an adaptation (`/adaptations/[slug]`), and a by-other-hands item (`/works-by-others/[slug]`) - SHALL render a "Report an issue" control. Submitting that control's form SHALL create a report of type `issue` referencing the specific item the page is showing.

#### Scenario: Reporting an issue from a work's detail page
- **WHEN** a signed-in user submits the "Report an issue" form from a work's detail page
- **THEN** an `issue` report is created referencing that work

#### Scenario: Reporting an issue from a short story's, adaptation's, or by-other-hands item's detail page
- **WHEN** a signed-in user submits the "Report an issue" form from a short story's, an adaptation's, or a by-other-hands item's detail page
- **THEN** an `issue` report is created referencing that specific short story, adaptation, or by-other-hands item respectively

### Requirement: Overview pages offer a "Report missing content" control
Every content overview page - works (`/works`), short works (`/short-works`), adaptations (`/adaptations`), and works by others (`/works-by-others`) - SHALL render a "Report missing content" control. Submitting that control's form SHALL create a report of type `missing_content`, not referencing any specific item.

#### Scenario: Reporting missing content from an overview page
- **WHEN** a signed-in user submits the "Report missing content" form from one of the four overview pages
- **THEN** a `missing_content` report is created with no item reference

### Requirement: Report requires a non-empty description within a length limit
The system SHALL require a non-empty description before a report - either type - can be submitted, and SHALL reject a description over 500 characters.

#### Scenario: Submitting with an empty description
- **WHEN** a signed-in user attempts to submit a report form with an empty description
- **THEN** the submission is rejected and the user is shown that a description is required

#### Scenario: Submitting with a description over the length limit
- **WHEN** a signed-in user attempts to submit a report form with a description over 500 characters
- **THEN** the submission is rejected and the user is shown that the description is too long

#### Scenario: Submitting with a valid description
- **WHEN** a signed-in user submits a report form with a non-empty description of 500 characters or fewer
- **THEN** the report is created and the user sees confirmation that it was submitted

### Requirement: Report author is always recorded
The system SHALL record the submitting user's identity on every report, regardless of report type.

#### Scenario: Report is attributed to its submitter
- **WHEN** a signed-in user submits a report
- **THEN** the report is stored with that user's identity attached

### Requirement: Reports are browsable on the Suggestion Box page, always anonymously
The system SHALL show every submitted report - type, content area, linked item (if any), description, and status - in a Reports section on the Suggestion Box page, visible to any signed-in user. The submitting user's identity SHALL NOT be shown anywhere in this list, regardless of who is viewing it.

#### Scenario: Signed-in user views the Reports section
- **WHEN** a signed-in user visits the Suggestion Box page
- **THEN** they see a Reports section listing submitted reports with their type, content area, linked item (if any), description, and status, and no submitter identity

#### Scenario: An issue report links to the item it's about
- **WHEN** a signed-in user views an `issue` report in the Reports section
- **THEN** the report shows a link to the specific work, short story, adaptation, or by-other-hands item it references

### Requirement: Report status
Every report SHALL have a status of `new`, `rejected`, or `applied`, set to `new` when the report is created. The status SHALL be visible to every signed-in user viewing the Reports section.

#### Scenario: New report starts as "new"
- **WHEN** a signed-in user submits a report
- **THEN** it appears in the Reports section with a status of "new"

### Requirement: Only admins can change a report's status
The system SHALL let an admin change a report's status to any of `new`, `rejected`, or `applied`, via a control shown inline in the Reports section. The system SHALL NOT show this control, or allow this change, to a signed-in user who is not an admin.

#### Scenario: Admin changes a report's status
- **WHEN** an admin selects a different status for a report
- **THEN** the report's status updates and the new status is reflected in the Reports section

#### Scenario: Non-admin has no status control
- **WHEN** a signed-in user who is not an admin views the Reports section
- **THEN** they see each report's status but have no control to change it

### Requirement: Reports section can be filtered by status
The system SHALL let a signed-in user filter the Reports section by status (`new`, `rejected`, `applied`, or an option showing every status), and SHALL default this filter to `new` on page load.

#### Scenario: Default page load shows only new reports
- **WHEN** a signed-in user navigates to the Suggestion Box page
- **THEN** only reports with status "new" are shown in the Reports section

### Requirement: Only admins can delete a report
The system SHALL let an admin permanently delete a report, via a control shown inline in the Reports section. The system SHALL NOT show this control, or allow this action, to a signed-in user who is not an admin. Deletion SHALL be permanent, with no way to recover a deleted report.

#### Scenario: Admin deletes a report
- **WHEN** an admin confirms deleting a report
- **THEN** the report is permanently removed and no longer appears in the Reports section

#### Scenario: Non-admin has no delete control
- **WHEN** a signed-in user who is not an admin views the Reports section
- **THEN** they see each report but have no control to delete it
