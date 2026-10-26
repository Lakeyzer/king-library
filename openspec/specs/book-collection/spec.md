# book-collection Specification

## Purpose

Lets a signed-in user build a personal collection of specific Open Library editions against a King work - adding and removing editions from the book actions control, a work's edition list, or their profile Bookshelf - while keeping the work's overall ownership flag in sync with whether any edition of it remains in the collection.

## Requirements

### Requirement: Signed-in user can add an edition to their collection
The system SHALL let a signed-in user add a specific Open Library edition of a King work to their collection. Adding an edition SHALL mark that King work `owned` for that user, in addition to recording the edition itself.

#### Scenario: Adding the first edition of a work
- **WHEN** a signed-in user adds an edition of a King work they do not yet own
- **THEN** that edition is recorded in their collection and the work becomes marked owned

#### Scenario: Adding a second edition of an already-owned work
- **WHEN** a signed-in user adds another edition of a King work they already own
- **THEN** the new edition is recorded in their collection alongside the existing one, and the work remains owned

#### Scenario: Signed-out visitor's add control opens the sign-in modal
- **WHEN** a signed-out visitor activates the control for adding an edition to a collection
- **THEN** the sign-in/sign-up modal opens instead of adding the edition

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

#### Scenario: Signed-out visitor sees the Add to Shelf control
- **WHEN** a signed-out visitor views a work's book actions
- **THEN** the Add to Shelf control is shown, and activating it opens the sign-in/sign-up modal instead of the editions picker

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

### Requirement: Copies in a collection carry optional copy details
The system SHALL let every item in a user's collection carry optional copy details. This covers both an added edition and an owned work with no edition recorded. Copy details SHALL consist of:
- a format: one of Paperback, Hardcover, Audiobook, Ebook, or not set
- an edition number: a whole number of 1 or more, or not set
- a printing number: a whole number of 1 or more, or not set
- a signed flag
- a dust jacket flag
- a book club edition flag
- a limited edition flag, with an optional copy number (1 to 6 letters or digits, e.g. "123" or "AA", stored uppercase) and an optional edition size (a whole number of 1 or more)

The edition number, printing number, signed flag and limited edition SHALL only be settable when the format is Paperback or Hardcover. The dust jacket and book club flags SHALL only be settable when the format is Hardcover. The copy number and edition size SHALL only be settable on a limited edition. Changing the format SHALL clear whatever the new format does not allow, and turning off limited edition SHALL clear its copy number and edition size. Copy details SHALL be readable by anyone who can read that user's collection, and writable only by the collection's owner.

#### Scenario: Physical copy with full details
- **WHEN** a signed-in user saves copy details of Hardcover, edition 1, printing 3, signed for an item in their collection
- **THEN** that item's copy details are stored exactly as entered

#### Scenario: Non-physical copy cannot carry edition or printing
- **WHEN** a signed-in user sets an item's format to Audiobook or Ebook
- **THEN** the edition, printing and signed inputs are not offered, and no edition number, printing number or signed flag is stored for that item

#### Scenario: Switching a physical copy to a non-physical format
- **WHEN** a signed-in user changes an item's format from Paperback to Ebook and saves
- **THEN** the item's edition number and printing number are cleared and it is no longer marked signed

#### Scenario: Hardcover-only details
- **WHEN** a signed-in user sets an item's format to Paperback
- **THEN** the dust jacket and book club inputs are not offered, and neither flag is stored for that item

#### Scenario: Lettered limited edition
- **WHEN** a signed-in user marks a Hardcover as a limited edition with copy number "aa" and edition size 26, and saves
- **THEN** the copy is stored as limited, copy number "AA" of 26

#### Scenario: Invalid copy number cannot be saved
- **WHEN** a signed-in user enters a limited copy number with characters other than letters and digits, or longer than 6 characters
- **THEN** the field shows an error and the form cannot be saved until it is fixed

#### Scenario: Invalid number rejected
- **WHEN** an edition number or printing number of less than 1 is submitted for an item
- **THEN** the value is not stored

#### Scenario: Another user cannot change copy details
- **WHEN** a user attempts to change copy details on an item in someone else's collection
- **THEN** the change is rejected

### Requirement: Format is guessed from Open Library when an edition is added
When a signed-in user adds an Open Library edition to their collection, the system SHALL guess that copy's format from the edition's Open Library physical format and store the guess as the copy's format:
- descriptions naming a hardcover, hardback, library binding, leather binding or turtleback, or the German, French, Spanish or Portuguese equivalents (gebunden, relié, tapa dura, capa dura), SHALL map to Hardcover
- descriptions naming a paperback, mass market, trade paper, softcover or pocket book, or the German, French, Spanish or Portuguese equivalents (Taschenbuch, broché, poche, rústica, brochura, tapa blanda), SHALL map to Paperback
- descriptions naming audio, an audio CD, a cassette, MP3 or a sound recording SHALL map to Audiobook
- descriptions naming an ebook, e-book, electronic resource, Kindle or EPUB SHALL map to Ebook

An edition with no physical format, or one that matches none of these (e.g. "Unknown Binding"), SHALL be added with no format set. No other copy detail SHALL ever be guessed.

#### Scenario: Mass market paperback edition
- **WHEN** a signed-in user adds an edition whose Open Library physical format is "Mass Market Paperback"
- **THEN** the copy is added with format Paperback

#### Scenario: Audio CD edition
- **WHEN** a signed-in user adds an edition whose Open Library physical format is "Audio CD"
- **THEN** the copy is added with format Audiobook

#### Scenario: Unrecognized or missing physical format
- **WHEN** a signed-in user adds an edition with no Open Library physical format, or one such as "Board book" that matches no rule
- **THEN** the copy is added with no format set

### Requirement: Adding an edition offers a copy-details form
After a signed-in user adds an edition from an editions list (the editions picker or a work's on-page edition list), the system SHALL open a copy-details form for that copy. The form SHALL be pre-filled with the guessed format. If the work was previously owned with no edition and already had copy details, the form SHALL be pre-filled with those details instead. The edition SHALL already be in the collection when the form opens. Dismissing the form without saving SHALL keep the edition with its pre-filled format.

#### Scenario: Confirming details after adding
- **WHEN** a signed-in user adds an edition, sets edition 1 and printing 1 in the copy-details form, and saves
- **THEN** the edition is in their collection with its format, edition 1 and printing 1

#### Scenario: Skipping the form
- **WHEN** a signed-in user adds an edition and closes the copy-details form without saving
- **THEN** the edition remains in their collection with the guessed format and no edition number, printing number or signed flag

#### Scenario: Correcting a wrong guess
- **WHEN** the guessed format for an added edition is Paperback but the user changes it to Hardcover in the copy-details form and saves
- **THEN** the copy is stored as Hardcover

#### Scenario: Picking an edition for a work already tagged without one
- **WHEN** a signed-in user owns a work with no edition, recorded as Hardcover, edition 1, printing 1, and then adds their first edition of it
- **THEN** the copy-details form opens pre-filled with Hardcover, edition 1, printing 1

#### Scenario: Removing an edition opens no form
- **WHEN** a signed-in user removes an already-added edition from an editions list
- **THEN** no copy-details form opens

### Requirement: Edition-less ownership accepts copy details
When a signed-in user marks a work "On my shelf" in the editions picker without picking an edition, the system SHALL offer the copy-details fields for that work. Saving them SHALL store the details against the work's ownership. When the work stops being owned, its edition-less copy details SHALL be cleared.

#### Scenario: Tagging an edition-less owned work
- **WHEN** a signed-in user marks a work "On my shelf" without an edition and sets its format to Paperback, edition 1, printing 2
- **THEN** the work is owned with those copy details

#### Scenario: Un-owning clears the details
- **WHEN** a signed-in user removes an edition-less owned work that had copy details from their collection
- **THEN** the work is no longer owned and its copy details are cleared, so they do not come back if it is marked owned again
