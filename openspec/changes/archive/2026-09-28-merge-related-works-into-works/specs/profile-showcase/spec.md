## ADDED Requirements

### Requirement: King progress indicators and collection ignore By Other Hands works
The system SHALL count only King works in the showcase's Overall Bibliography, Bachman Books, Dark Tower, and Collection indicators, in both the count and the total. A By Other Hands work the profile owner has read or owns SHALL NOT change any of these four indicators, including a By Other Hands work flagged as Dark Tower.

#### Scenario: A read By Other Hands work leaves Overall Bibliography unchanged
- **WHEN** a showcase is displayed for a profile owner who has read a By Other Hands work
- **THEN** the Overall Bibliography indicator's read count and total count only King works

#### Scenario: A read Dark Tower comic leaves the Dark Tower indicator unchanged
- **WHEN** a showcase is displayed for a profile owner who has read a Dark Tower By Other Hands comic
- **THEN** the Dark Tower indicator's read count and total count only King works

#### Scenario: An owned By Other Hands work leaves Collection unchanged
- **WHEN** a showcase is displayed for a profile owner who owns a By Other Hands work
- **THEN** the Collection indicator's owned count and total count only King works, while the Bookshelf still shows a tile for that By Other Hands work

### Requirement: Showcase recommendations never name a By Other Hands work
The system SHALL consider only King works for the showcase's owned-unread recommendation and gift-idea recommendation.

#### Scenario: An owned, unread By Other Hands work is not recommended
- **WHEN** the profile owner owns a By Other Hands work they have not read, and owns no unread King work
- **THEN** no owned-unread recommendation card is shown

#### Scenario: A wanted, unowned By Other Hands work is not a gift idea
- **WHEN** a visitor who is not the profile owner views a public showcase whose owner wants to read a By Other Hands work they do not own, and has no such King work
- **THEN** no gift-idea recommendation card is shown

## MODIFIED Requirements

### Requirement: Currently Reading always includes By Other Hands works
The system SHALL show, in the Currently Reading section, every By Other Hands work the profile owner currently has marked currently-reading, in addition to King works. A By Other Hands item SHALL link to its By Other Hands detail page and SHALL offer the same owner-only finish action as a King item, using the same finish-reading flow.

#### Scenario: By Other Hands work shown in Currently Reading
- **WHEN** a visitor views a showcase where the profile owner is currently reading a By Other Hands work
- **THEN** that work appears in the Currently Reading section alongside any King works

#### Scenario: Owner can finish a By Other Hands currently-reading item
- **WHEN** the profile owner activates the finish action on a By Other Hands work in their Currently Reading section
- **THEN** they are prompted with the same finish-reading flow used for a King work, and confirming it logs a read for that work
