## MODIFIED Requirements

### Requirement: Search matches by case-insensitive title substring
The system SHALL match the query against the title field of works, short stories, and adaptations using a case-insensitive substring comparison, updating results as the visitor types. Matching against King work titles and adaptation titles SHALL only consider active King works and active adaptations; inactive ones SHALL never appear as matches.

#### Scenario: Case-insensitive matching
- **WHEN** a visitor types a query in a different case than the target title (for example "it" for "It")
- **THEN** the item is included in the matching results

#### Scenario: Empty query
- **WHEN** the search dialog is opened and the query is empty
- **THEN** no results are displayed yet

#### Scenario: Query matches an inactive King work or adaptation
- **WHEN** a visitor types a query that matches the title of a King work or adaptation whose active flag is false
- **THEN** that inactive item does not appear in the results
