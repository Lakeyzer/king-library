## ADDED Requirements

### Requirement: Room 217 search reveals a hidden message
When a visitor's search text on the works page is exactly "217" (ignoring leading/trailing whitespace) and it matches no King work, the system SHALL show a message reading "You weren't supposed to find this." in place of the normal empty-search-results state, referencing *The Shining*'s Room 217.

#### Scenario: Searching 217 with no matches
- **WHEN** a visitor enters "217" into the works search input and no King work title matches it
- **THEN** the list area shows "You weren't supposed to find this." instead of the normal empty-search-results state

#### Scenario: 217 happens to match a work
- **WHEN** a visitor enters "217" into the works search input and it matches one or more King work titles
- **THEN** the list shows those matching works as normal, without the hidden message
