## ADDED Requirements

### Requirement: Short stories list is filterable by read status for signed-in users
The system SHALL show a signed-in user a read-status filter on the short works page, choosing between "All", "Read", and "Unread". Selecting "Read" restricts the visible items to short stories the user has marked read; selecting "Unread" restricts the visible items to short stories the user has not marked read; selecting "All" applies no restriction based on read status. The filter SHALL default to "All" each time the page loads. The system SHALL NOT show the read-status filter to a signed-out visitor, and SHALL NOT apply any read-status restriction for a signed-out visitor.

#### Scenario: Filtering to read short stories
- **WHEN** a signed-in user selects "Read" in the read-status filter
- **THEN** the list shows only short stories the user has marked read

#### Scenario: Filtering to unread short stories
- **WHEN** a signed-in user selects "Unread" in the read-status filter
- **THEN** the list shows only short stories the user has not marked read

#### Scenario: Clearing the read-status filter
- **WHEN** a signed-in user selects "All" in the read-status filter
- **THEN** the list shows short stories regardless of read status, subject to any other active search or filters

#### Scenario: Read-status filter defaults to All
- **WHEN** a signed-in user loads the short works page
- **THEN** the read-status filter is set to "All" and no short story is hidden because of its read status

#### Scenario: Marking a short story read while filtering to unread
- **WHEN** a signed-in user has "Unread" selected and marks a listed short story read
- **THEN** that short story leaves the list, since it no longer matches the active filter

#### Scenario: Signed-out visitor sees no read-status filter
- **WHEN** a signed-out visitor views the short works page
- **THEN** no read-status filter is shown and the list is not restricted by read status

## MODIFIED Requirements

### Requirement: Short stories list filters and search combine
The system SHALL apply the title search, the type filter, the "Not in a collection" filter, and (for a signed-in user) the read-status filter together, showing only short stories that satisfy every active constraint at once.

#### Scenario: Combining search and type filter
- **WHEN** a visitor has a search term and the type filter both active
- **THEN** the list shows only short stories that match the search term and the selected type

#### Scenario: Combining the read-status filter with other filters
- **WHEN** a signed-in user has a search term, a type filter, "Not in a collection" checked, and a read-status selection other than "All" active
- **THEN** the list shows only short stories that match the search term and the selected type, appear in no collection, and match the selected read status, all at once
