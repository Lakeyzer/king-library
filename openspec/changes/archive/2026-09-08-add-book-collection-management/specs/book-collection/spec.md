## Purpose

Lets a signed-in user build a personal collection of specific Open Library editions against a King work — adding and removing editions from the book actions control, a work's edition list, or their profile Bookshelf — while keeping the work's overall ownership flag in sync with whether any edition of it remains in the collection.

## ADDED Requirements

### Requirement: Signed-in user can add an edition to their collection
The system SHALL let a signed-in user add a specific Open Library edition of a King work to their collection. Adding an edition SHALL mark that King work `owned` for that user, in addition to recording the edition itself.

#### Scenario: Adding the first edition of a work
- **WHEN** a signed-in user adds an edition of a King work they do not yet own
- **THEN** that edition is recorded in their collection and the work becomes marked owned

#### Scenario: Adding a second edition of an already-owned work
- **WHEN** a signed-in user adds another edition of a King work they already own
- **THEN** the new edition is recorded in their collection alongside the existing one, and the work remains owned

#### Scenario: Signed-out visitor has no add control
- **WHEN** a signed-out visitor views a work's editions
- **THEN** no control for adding an edition to a collection is shown

### Requirement: Signed-in user can remove an edition from their collection
The system SHALL let a signed-in user remove an edition they previously added from their collection.

#### Scenario: Removing one of several editions
- **WHEN** a signed-in user removes an edition of a King work for which they have more than one edition recorded
- **THEN** that edition is removed from their collection and the work remains marked owned

#### Scenario: Removing a work's last remaining edition
- **WHEN** a signed-in user removes the only edition they have recorded for a King work
- **THEN** that edition is removed from their collection and the work is no longer marked owned

### Requirement: Signed-in user can remove an edition-less owned work from their collection
The system SHALL let a signed-in user remove a King work they own with no edition recorded against it directly from their collection, marking the work no longer owned.

#### Scenario: Removing an edition-less owned work
- **WHEN** a signed-in user removes a King work from their collection that they own but have no recorded edition of
- **THEN** the work is no longer marked owned

### Requirement: Add to Shelf control on the book actions component
The system SHALL show a signed-in user an "Add to Shelf" control among a King work's book actions, which opens an editions picker for that work. This control SHALL be available both where book actions are shown in their compact form and where they are shown in their expanded form. The control's label SHALL reflect whether the user already owns the work.

#### Scenario: Activating Add to Shelf in compact book actions
- **WHEN** a signed-in user activates the Add to Shelf control shown in a work's compact book actions
- **THEN** the editions picker for that work opens

#### Scenario: Activating Add to Shelf in expanded book actions
- **WHEN** a signed-in user activates the Add to Shelf control shown in a work's expanded book actions
- **THEN** the editions picker for that work opens

#### Scenario: Control label reflects ownership
- **WHEN** a signed-in user who already owns a King work views that work's book actions
- **THEN** the Add to Shelf control's label indicates the work is already on their shelf, rather than inviting them to add it

#### Scenario: Signed-out visitor sees no Add to Shelf control
- **WHEN** a signed-out visitor views a work's book actions
- **THEN** no Add to Shelf control is shown

### Requirement: Editions picker always shows the vertical layout
The system SHALL present the editions picker opened from Add to Shelf using the vertical, paginated editions layout at every viewport width, rather than the horizontal scrolling layout used elsewhere.

#### Scenario: Opening the editions picker on a wide viewport
- **WHEN** a signed-in user opens the editions picker on a viewport wide enough that a work's on-page edition list would normally show the horizontal layout
- **THEN** the editions picker still shows editions in the vertical, paginated layout

### Requirement: Editions picker supports searching by year and publisher
The system SHALL let a user filter the editions picker's list by matching text against an edition's publication year or publisher.

#### Scenario: Searching by publication year
- **WHEN** a user enters a year in the editions picker's search field
- **THEN** the list shows only editions whose publication year matches

#### Scenario: Searching by publisher
- **WHEN** a user enters a publisher name in the editions picker's search field
- **THEN** the list shows only editions whose publisher matches

### Requirement: Editions can be added and removed directly from a work's on-page edition list
The system SHALL let a signed-in user add or remove editions using the same controls directly within the edition list shown on a King work's detail page, without needing to open the editions picker.

#### Scenario: Adding an edition from the on-page edition list
- **WHEN** a signed-in user activates the add control on an edition shown in a work's on-page edition list
- **THEN** that edition is added to their collection the same as if added from the editions picker

#### Scenario: An already-added edition shows as added
- **WHEN** a signed-in user views a work's on-page edition list or the editions picker for a work they have one or more editions of
- **THEN** each edition they have already added is shown as added rather than showing an add control

### Requirement: Edition covers can be viewed full size
The system SHALL let a user activate an edition's cover thumbnail, wherever it's shown (the editions picker, a work's on-page edition list), to view that cover at full size. An edition with no cover has no such control.

#### Scenario: Viewing a cover full size
- **WHEN** a user activates an edition's cover thumbnail that has a cover image
- **THEN** that cover is shown at full size

#### Scenario: Edition with no cover has no full-size control
- **WHEN** a user views an edition with no cover image
- **THEN** no control for viewing it full size is shown

### Requirement: Editions picker links to Open Library for a missing edition
The system SHALL show a link from the editions picker to Open Library's add-edition form for that work, so a user whose specific copy is not listed can add it there themselves.

#### Scenario: Following the Open Library link
- **WHEN** a user activates the Open Library link shown in the editions picker
- **THEN** they are taken to Open Library's form for adding a new edition of that King work
