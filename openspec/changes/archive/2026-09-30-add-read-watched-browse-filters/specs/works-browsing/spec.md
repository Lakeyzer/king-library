## ADDED Requirements

### Requirement: Works list is filterable by read status for signed-in users
The system SHALL show a signed-in user a read-status filter on the works page, choosing between "All", "Read", and "Unread". Selecting "Read" restricts the visible items to King works the user has marked read at least once; selecting "Unread" restricts the visible items to King works the user has never marked read (including works they own, want to read, or are currently reading but have not finished); selecting "All" applies no restriction based on read status. The filter SHALL default to "All" each time the page loads. The system SHALL NOT show the read-status filter to a signed-out visitor, and SHALL NOT apply any read-status restriction for a signed-out visitor.

#### Scenario: Filtering to read works
- **WHEN** a signed-in user selects "Read" in the read-status filter
- **THEN** the list shows only King works the user has marked read

#### Scenario: Filtering to unread works
- **WHEN** a signed-in user selects "Unread" in the read-status filter
- **THEN** the list shows only King works the user has not marked read, including works they are currently reading or want to read

#### Scenario: Clearing the read-status filter
- **WHEN** a signed-in user selects "All" in the read-status filter
- **THEN** the list shows King works regardless of read status, subject to any other active search or filters

#### Scenario: Read-status filter defaults to All
- **WHEN** a signed-in user loads the works page
- **THEN** the read-status filter is set to "All" and no work is hidden because of its read status

#### Scenario: Marking a work read while filtering to unread
- **WHEN** a signed-in user has "Unread" selected and marks a listed work read
- **THEN** that work leaves the list, since it no longer matches the active filter

#### Scenario: Signed-out visitor sees no read-status filter
- **WHEN** a signed-out visitor views the works page
- **THEN** no read-status filter is shown and the list is not restricted by read status

## MODIFIED Requirements

### Requirement: Works list filters and search combine
The system SHALL apply the title search, the flag filter, the type filter, and (for a signed-in user) the read-status filter together, showing only works that satisfy every active constraint at once.

#### Scenario: Combining search, flag filter, and type filter
- **WHEN** a visitor has a search term, a flag filter selection other than "All", and a type filter active
- **THEN** the list shows only King works that match the search term, the selected flag, and the selected type at once

#### Scenario: Combining the read-status filter with other filters
- **WHEN** a signed-in user has a search term, a flag filter selection other than "All", a type filter, and a read-status selection other than "All" active
- **THEN** the list shows only King works that match the search term, the selected flag, the selected type, and the selected read status at once
