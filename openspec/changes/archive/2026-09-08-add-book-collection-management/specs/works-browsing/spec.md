## ADDED Requirements

### Requirement: Signed-in visitors see a personalized owned-unread recommendation
The system SHALL show a signed-in visitor, in the works page's sidebar, a recommendation for one King work they own but have not read. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor owns a King work they have not read
- **THEN** the works page sidebar recommends one such King work

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor owns no King work they have not read
- **THEN** no owned-unread recommendation card is shown

#### Scenario: Signed-out visitor sees no owned-unread recommendation
- **WHEN** a signed-out visitor views the works page
- **THEN** no owned-unread recommendation card is shown
