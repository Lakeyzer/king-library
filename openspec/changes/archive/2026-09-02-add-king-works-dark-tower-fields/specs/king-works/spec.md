## MODIFIED Requirements

### Requirement: Canonical King works storage
The system SHALL persist a canonical list of King works, each with a title, a type, an original publish year, an optional Open Library work key for matching against Open Library search results, a Dark Tower flag indicating whether the work is one of the core Dark Tower series works, a Bachman flag, and an optional Dark Tower relation note describing how the work connects to the Dark Tower series.

#### Scenario: A work has the expected fields
- **WHEN** a King work is stored in the canonical list
- **THEN** it has a title, a type, an original publish year, either an Open Library work key or no key, a Dark Tower flag, a Bachman flag, and either a Dark Tower relation note or no note

#### Scenario: A work defaults to not Dark Tower and not Bachman
- **WHEN** a King work is stored without an explicit Dark Tower flag or Bachman flag
- **THEN** its Dark Tower flag is false and its Bachman flag is false

#### Scenario: A work with no connection to the Dark Tower has no relation note
- **WHEN** a King work has no connection to the Dark Tower series
- **THEN** its Dark Tower flag is false and its Dark Tower relation note is absent (null)

#### Scenario: A work connected to but not part of the Dark Tower series
- **WHEN** a King work shares characters, settings, or events with the Dark Tower series without being one of its entries
- **THEN** its Dark Tower flag is false and its Dark Tower relation note describes the connection

### Requirement: Seed data reflects the canonical bibliography
The system's initial King works data SHALL include Carrie (1974), 'Salem's Lot (1975), and Cujo (1981), each recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** the list includes exactly Carrie, 'Salem's Lot, and Cujo with their correct type, publish year, Open Library work key, Dark Tower flag of false, Bachman flag of false, and no Dark Tower relation note
