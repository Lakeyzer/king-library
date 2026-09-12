## ADDED Requirements

### Requirement: Room 217 search reveals a hidden message
When a visitor's query in the global search dialog is exactly "217" (ignoring leading/trailing whitespace) and it matches no King work, short story, or adaptation title, the system SHALL show a single message reading "You weren't supposed to find this." in place of the normal three-category empty state, referencing *The Shining*'s Room 217.

#### Scenario: Searching 217 with no matches
- **WHEN** a visitor types "217" into the global search dialog and it matches no work, short story, or adaptation title
- **THEN** the dialog shows "You weren't supposed to find this." instead of the normal three category groups

#### Scenario: 217 happens to match a title
- **WHEN** a visitor types "217" into the global search dialog and it matches at least one work, short story, or adaptation title
- **THEN** the dialog shows the normal category groups with those matches, without the hidden message
