## ADDED Requirements

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
