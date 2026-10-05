## ADDED Requirements

### Requirement: By Other Hands list is filterable by read status for signed-in users
The system SHALL show a signed-in user a read-status filter on the `/works-by-others` page, choosing between "All", "Read", and "Unread". Selecting "Read" restricts the visible items to By Other Hands works the user has marked read at least once; selecting "Unread" restricts the visible items to By Other Hands works the user has never marked read (including works they own or are currently reading but have not finished); selecting "All" applies no restriction based on read status. The filter SHALL default to "All" each time the page loads, and SHALL combine with the page's title search and category filter so only works satisfying every active constraint are shown. The system SHALL NOT show the read-status filter to a signed-out visitor, and SHALL NOT apply any read-status restriction for a signed-out visitor.

#### Scenario: Filtering to read By Other Hands works
- **WHEN** a signed-in user selects "Read" in the read-status filter on `/works-by-others`
- **THEN** the list shows only By Other Hands works the user has marked read

#### Scenario: Filtering to unread By Other Hands works
- **WHEN** a signed-in user selects "Unread" in the read-status filter on `/works-by-others`
- **THEN** the list shows only By Other Hands works the user has not marked read

#### Scenario: Combining the read-status filter with search and category
- **WHEN** a signed-in user has a search term, a category filter, and a read-status selection other than "All" active
- **THEN** the list shows only By Other Hands works that match the search term, the selected category, and the selected read status at once

#### Scenario: Read-status filter defaults to All
- **WHEN** a signed-in user loads `/works-by-others`
- **THEN** the read-status filter is set to "All" and no work is hidden because of its read status

#### Scenario: Signed-out visitor sees no read-status filter
- **WHEN** a signed-out visitor views `/works-by-others`
- **THEN** no read-status filter is shown and the list is not restricted by read status
