## RENAMED Requirements

- FROM: `### Requirement: Profile page organizes content into three tabs behind a persistent header`
- TO: `### Requirement: Profile page organizes content into four tabs behind a persistent header`

## MODIFIED Requirements

### Requirement: Profile page organizes content into four tabs behind a persistent header
The system SHALL present a profile as a persistent header (avatar, username, tagline, and the share-or-follow control) alongside four tabs, in this order: Reader Checklist, Wishlist, Read List, and Watch List. Each tab SHALL be a distinct, independently reachable route rather than client-only tab state. Reader Checklist SHALL show the dashboard content described elsewhere in this capability (reading progress, currently reading, reading timeline, bookshelf, recommendations) and SHALL be the tab shown when no other tab is specified. Wishlist SHALL show the profile owner's wishlist (see the wishlist capability). The header SHALL remain visible and unchanged while switching between tabs.

#### Scenario: Visiting a profile with no tab specified
- **WHEN** a visitor navigates to a profile's base URL (own or by username)
- **THEN** the header is shown along with the Reader Checklist tab's content

#### Scenario: Tabs appear in order with Wishlist second
- **WHEN** a visitor views any profile tab
- **THEN** the tabs are shown in the order Reader Checklist, Wishlist, Read List, Watch List

#### Scenario: Switching tabs keeps the header in place
- **WHEN** a visitor switches from one tab to another on a profile
- **THEN** the header (avatar, username, tagline, share-or-follow control) remains visible and unchanged, and only the tab content area updates

#### Scenario: Each tab is independently reachable
- **WHEN** a visitor navigates directly to a specific tab's URL, including the Wishlist tab's
- **THEN** the header and that tab's content are shown, without needing to first visit the profile's base URL
