## ADDED Requirements

### Requirement: Room 217 search reveals a hidden message
When a visitor's search text on the adaptations page is exactly "217" (ignoring leading/trailing whitespace) and it matches no adaptation, the system SHALL show a message reading "You weren't supposed to find this." in place of the normal empty-search-results state, referencing *The Shining*'s Room 217.

#### Scenario: Searching 217 with no matches
- **WHEN** a visitor enters "217" into the adaptations search input and no adaptation title matches it
- **THEN** the list area shows "You weren't supposed to find this." instead of the normal empty-search-results state

#### Scenario: 217 happens to match an adaptation
- **WHEN** a visitor enters "217" into the adaptations search input and it matches one or more adaptation titles
- **THEN** the list shows those matching adaptations as normal, without the hidden message
