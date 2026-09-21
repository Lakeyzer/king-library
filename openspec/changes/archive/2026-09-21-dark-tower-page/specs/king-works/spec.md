## MODIFIED Requirements

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of active King works for display, including each work's title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note. Inactive works SHALL be excluded from this list.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works for display
- **THEN** it receives every active King work currently in storage, including title, original publish date, type, Open Library cover identifier, Dark Tower flag, Bachman flag, and Dark Tower relation note

#### Scenario: An inactive work is excluded
- **WHEN** application code requests all King works for display and one or more King works have an active flag of false
- **THEN** those inactive works are not included in the results

### Requirement: Seed data reflects the canonical bibliography
The system's initial King works data SHALL include Carrie (published 1974-04-05) and Cujo (published 1981-09-08), each recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note; and 'Salem's Lot (published 1975-10-17), recorded as type "novel" with its corresponding Open Library work key, a Dark Tower flag of false, a Bachman flag of false, and the Dark Tower relation note described in the "Seed data includes Dark Tower relation notes for connected works" requirement below.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** the list includes exactly Carrie, 'Salem's Lot, and Cujo with their correct type, publish date, and Open Library work key; Carrie and Cujo have a Dark Tower flag of false, a Bachman flag of false, and no Dark Tower relation note; 'Salem's Lot has a Dark Tower flag of false, a Bachman flag of false, and its Dark Tower relation note

## ADDED Requirements

### Requirement: Seed data includes Dark Tower relation notes for connected works
The system's initial King works data SHALL include a Dark Tower relation note, and a Dark Tower flag of false, for each of the following works, describing how it connects to the Dark Tower series without being one of its eight core entries: 'Salem's Lot, The Stand, The Eyes of the Dragon, The Talisman, Black House, Insomnia, Rose Madder, Hearts in Atlantis, Everything's Eventual, IT, Desperation, The Regulators, and Charlie the Choo-Choo. Every other King work SHALL have no Dark Tower relation note unless individually specified otherwise.

#### Scenario: Initial dataset is loaded
- **WHEN** the canonical King works data is loaded into the system
- **THEN** 'Salem's Lot, The Stand, The Eyes of the Dragon, The Talisman, Black House, Insomnia, Rose Madder, Hearts in Atlantis, Everything's Eventual, IT, Desperation, The Regulators, and Charlie the Choo-Choo each have a Dark Tower flag of false and a non-null Dark Tower relation note, and no other King work outside this list and the eight core Dark Tower novels has a Dark Tower relation note
