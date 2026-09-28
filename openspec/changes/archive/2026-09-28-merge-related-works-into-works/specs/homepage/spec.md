## ADDED Requirements

### Requirement: Homepage book figures ignore By Other Hands works
The system SHALL consider only King works for every book figure on the homepage. A By Other Hands work, and every user's tracking of it, SHALL NOT affect any of these:
- the stats card's books-read and books-owned counts
- the Works catalog total
- the Most Read Books and Currently Being Read leaderboards
- the Least Read Book, Most Wanted, Book of the Week, and Book Birthday spotlights
- the personalized book and owned-unread recommendations

#### Scenario: Stats card ignores By Other Hands reads and ownership
- **WHEN** users have marked By Other Hands works read or owned
- **THEN** the stats card's books-read and books-owned counts are the same as if they had not

#### Scenario: Works catalog total counts only King works
- **WHEN** any visitor views the catalog links row
- **THEN** the Works total is the number of active King works, not including any By Other Hands work

#### Scenario: Leaderboards never list a By Other Hands work
- **WHEN** a By Other Hands work has more reads or more current readers than any King work
- **THEN** it does not appear in the Most Read Books or Currently Being Read leaderboards

#### Scenario: Spotlights never feature a By Other Hands work
- **WHEN** any visitor views the homepage
- **THEN** the Least Read Book, Most Wanted, Book of the Week, and Book Birthday spotlights each feature only King works

#### Scenario: Recommendations never name a By Other Hands work
- **WHEN** a signed-in visitor owns an unread By Other Hands work and no unread King work
- **THEN** no owned-unread recommendation card is shown
