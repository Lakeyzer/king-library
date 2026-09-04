## MODIFIED Requirements

### Requirement: Works list item reserves space for action buttons
Each works list item SHALL reserve an actions area at the trailing edge of its metadata row, justified opposite the release year and type at the leading edge. For a signed-in user, this area SHALL show a single split button reflecting that work's current reading status for that user: a primary segment whose action depends on state, and a secondary chevron segment opening a dropdown menu of the state's other applicable actions. For a signed-out visitor, the actions area SHALL remain empty.

The primary action is "Mark as Read" when the work is not want-to-read, not currently-reading, and not read; "Start Reading" when the work is want-to-read; "Finish" when the work is currently-reading; and "Mark as Not Read" when the work is read.

The dropdown lists whichever of Want to Read, Start Reading, Finish, Mark as Read, and Mark as Not Read is not the current primary action and would have an actual effect, omitting any action the underlying data rules would silently ignore.

#### Scenario: Viewing a list item's metadata row
- **WHEN** a visitor views a work's list item
- **THEN** the metadata row shows the release year and type grouped at the leading edge and an actions area reserved at the trailing edge

#### Scenario: Viewing a list item's metadata row as a signed-out visitor
- **WHEN** a signed-out visitor views a work's list item
- **THEN** the actions area is empty

#### Scenario: Neutral work shows Mark as Read as the primary action
- **WHEN** a signed-in user views a work that is not want-to-read, not currently-reading, and not read
- **THEN** the split button's primary action is "Mark as Read", and its dropdown offers Want to Read and Start Reading

#### Scenario: Want-to-read work shows Start Reading as the primary action
- **WHEN** a signed-in user views a work that is want-to-read
- **THEN** the split button's primary action is "Start Reading", and its dropdown offers removing Want to Read and Mark as Read

#### Scenario: Currently-reading work shows Finish as the primary action
- **WHEN** a signed-in user views a work that is currently-reading
- **THEN** the split button's primary action is "Finish", and its dropdown offers Mark as Read

#### Scenario: Read work shows Mark as Not Read as the primary action
- **WHEN** a signed-in user views a work that is read
- **THEN** the split button's primary action is "Mark as Not Read", and its dropdown has no other applicable actions
