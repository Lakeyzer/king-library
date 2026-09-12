# global-search Specification

## Purpose

Lets a visitor find any King work, short story, or adaptation by title from anywhere in the app through a single search dialog, without having to browse each domain's index page individually.

## Requirements

### Requirement: Search dialog groups results into three categories
The system SHALL search the visitor's query against King work titles, short story titles, and adaptation titles, and present matches grouped under three always-visible category labels: Works, Short Stories, and Adaptations.

#### Scenario: Query matches titles in multiple categories
- **WHEN** a visitor types a query that matches at least one work title, one short story title, and one adaptation title
- **THEN** the dialog displays all three category groups, each listing its own matching titles

#### Scenario: Query matches only some categories
- **WHEN** a visitor types a query that matches titles in only one or two of the three categories
- **THEN** the dialog still displays all three category labels, with categories that have no matches showing no results

### Requirement: Search matches by case-insensitive title substring
The system SHALL match the query against the title field of works, short stories, and adaptations using a case-insensitive substring comparison, updating results as the visitor types.

#### Scenario: Case-insensitive matching
- **WHEN** a visitor types a query in a different case than the target title (for example "it" for "It")
- **THEN** the item is included in the matching results

#### Scenario: Empty query
- **WHEN** the search dialog is opened and the query is empty
- **THEN** no results are displayed yet

### Requirement: Selecting a result navigates to its detail page
The system SHALL close the dialog and navigate the visitor to the selected result's detail page, matching the category the result was selected from: a work's page, a short story's page, or an adaptation's page.

#### Scenario: Selecting a work result
- **WHEN** a visitor selects a result from the Works category
- **THEN** the dialog closes and the visitor is taken to that work's detail page

#### Scenario: Selecting a short story result
- **WHEN** a visitor selects a result from the Short Stories category
- **THEN** the dialog closes and the visitor is taken to that short story's detail page

#### Scenario: Selecting an adaptation result
- **WHEN** a visitor selects a result from the Adaptations category
- **THEN** the dialog closes and the visitor is taken to that adaptation's detail page
