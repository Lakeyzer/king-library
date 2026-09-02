## MODIFIED Requirements

### Requirement: Retrieve all King works for display
The system SHALL provide a way for application code to fetch the full list of King works for display, including each work's title, original publish year, type, Dark Tower flag, and Bachman flag.

#### Scenario: Fetching all works
- **WHEN** application code requests all King works
- **THEN** it receives every King work currently in storage, including title, original publish year, type, Dark Tower flag, and Bachman flag
