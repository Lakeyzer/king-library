## MODIFIED Requirements

### Requirement: Bookshelf owner can remove a tile, with confirmation
The system SHALL show the profile owner a remove control on each Bookshelf tile, shown only to the profile owner, which asks for confirmation before removing that item from their collection (per the book-collection capability's edition and edition-less-work removal behavior). The confirmation prompt SHALL read "Say true?" and its confirm action SHALL read "Say thankya" (Dark Tower ka-tet affirmation phrasing), in place of generic confirm/cancel copy.

#### Scenario: Owner removes a tile after confirming
- **WHEN** the profile owner activates a Bookshelf tile's remove control and confirms the prompt
- **THEN** that item is removed from their collection and its tile no longer appears on the Bookshelf

#### Scenario: Owner cancels the remove confirmation
- **WHEN** the profile owner activates a Bookshelf tile's remove control and cancels the prompt instead of confirming
- **THEN** the item remains in their collection and its tile stays on the Bookshelf

#### Scenario: Visitor viewing another user's Bookshelf sees no remove control
- **WHEN** a visitor who is not the profile owner views that profile's Bookshelf
- **THEN** no remove control is shown on any tile

#### Scenario: Remove confirmation uses ka-tet phrasing
- **WHEN** the profile owner activates a Bookshelf tile's remove control
- **THEN** the confirmation prompt reads "Say true?" and its confirm action reads "Say thankya"
