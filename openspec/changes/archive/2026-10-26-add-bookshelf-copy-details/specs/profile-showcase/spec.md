## ADDED Requirements

### Requirement: Bookshelf tiles show a spine
The system SHALL show every Bookshelf tile as a book with a spine: a bar down the left edge of the cover that runs its full height. The spine SHALL show the copy's format label (Paperback, Hardcover, Audiobook or Ebook) rotated 90 degrees clockwise, the way a spine title reads. When no format is set, the spine SHALL show the work's title instead. A label longer than the spine's free height SHALL be cut off with an ellipsis rather than overlapping the marks. The copy's limited edition indicator, signed indicator and gold or silver mark SHALL be shown at the foot of the spine, in that order from top to bottom. The spine SHALL be visible to every visitor who can see the Bookshelf.

#### Scenario: Copy with a format
- **WHEN** the Bookshelf shows a Hardcover copy
- **THEN** its tile has a spine reading "Hardcover", turned 90 degrees clockwise

#### Scenario: Copy without a format
- **WHEN** the Bookshelf shows a copy with no format set
- **THEN** its tile has a spine showing the work's title, turned 90 degrees clockwise and cut off with an ellipsis if it does not fit

#### Scenario: Marks sit on the spine
- **WHEN** the Bookshelf shows a signed first edition, first printing
- **THEN** the gold mark and the signed indicator are shown at the foot of its spine

### Requirement: Bookshelf marks first-edition copies in gold or silver
The system SHALL show a mark on a Bookshelf tile when its copy is a Paperback or Hardcover with edition number 1:
- a gold mark when the printing number is 1
- a silver mark when the printing number is 2 or more, or not set

No mark SHALL be shown for any other copy. That includes a later edition, a copy with no edition number, a copy with no format, an Audiobook or Ebook, and a book club edition (which collectors do not count as a true first, even with edition 1 and printing 1). The mark SHALL be visible to every visitor who can see the Bookshelf. It SHALL have an accessible label: "First edition, first printing" for gold, "First edition, later printing" for silver with a printing number, and "First edition" for silver with no printing number.

#### Scenario: First edition, first printing
- **WHEN** the Bookshelf shows a Hardcover copy with edition 1 and printing 1
- **THEN** its tile shows the gold mark

#### Scenario: First edition, later printing
- **WHEN** the Bookshelf shows a Paperback copy with edition 1 and printing 4
- **THEN** its tile shows the silver mark

#### Scenario: First edition with unknown printing
- **WHEN** the Bookshelf shows a Hardcover copy with edition 1 and no printing number
- **THEN** its tile shows the silver mark, labelled "First edition"

#### Scenario: Later edition
- **WHEN** the Bookshelf shows a Hardcover copy with edition 2 and printing 1
- **THEN** its tile shows no mark

#### Scenario: Book club edition
- **WHEN** the Bookshelf shows a Hardcover book club edition with edition 1 and printing 1
- **THEN** its tile shows no mark

#### Scenario: Visitor sees the marks
- **WHEN** a visitor who is not the profile owner views a public profile's Bookshelf containing a first edition, first printing
- **THEN** that tile shows the gold mark

### Requirement: Bookshelf marks signed copies
The system SHALL show a signed indicator, with the accessible label "Signed", on every Bookshelf tile whose copy is marked signed. This SHALL work alongside any gold or silver mark and SHALL be visible to every visitor who can see the Bookshelf.

#### Scenario: Signed first printing
- **WHEN** the Bookshelf shows a signed Hardcover copy with edition 1 and printing 1
- **THEN** its tile shows both the gold mark and the signed indicator

#### Scenario: Unsigned copy
- **WHEN** the Bookshelf shows a copy that is not marked signed
- **THEN** its tile shows no signed indicator

### Requirement: Bookshelf marks limited edition copies
The system SHALL show a limited edition indicator on every Bookshelf tile whose copy is marked as a limited edition, visible to every visitor who can see the Bookshelf. Its accessible label SHALL describe as much of the edition as is recorded:
- "Limited edition, #123 of 750" for a numbered copy with an edition size
- "Lettered copy AA of 26" for a lettered copy with an edition size
- the same without " of N" when no edition size is recorded
- "Limited edition of 500" when only the edition size is recorded
- "Limited edition" when neither is recorded

Book club edition SHALL NOT show an indicator on the tile.

#### Scenario: Numbered limited edition
- **WHEN** the Bookshelf shows a limited edition copy numbered 123 of 750
- **THEN** its tile shows the limited edition indicator, labelled "Limited edition, #123 of 750"

#### Scenario: Lettered limited edition
- **WHEN** the Bookshelf shows a limited edition copy lettered AA of 26
- **THEN** its tile shows the limited edition indicator, labelled "Lettered copy AA of 26"

#### Scenario: Not a limited edition
- **WHEN** the Bookshelf shows a copy that is not marked as a limited edition
- **THEN** its tile shows no limited edition indicator

### Requirement: Bookshelf marks copies with a dust jacket
The system SHALL mark every Bookshelf tile whose copy has a dust jacket with an upright open-book icon on the spine directly after its label. The marker SHALL be visible to every visitor who can see the Bookshelf, and SHALL have the accessible label "Dust jacket".

#### Scenario: Hardcover with a dust jacket
- **WHEN** the Bookshelf shows a Hardcover copy marked as having a dust jacket
- **THEN** its spine shows the dust jacket icon directly after the "Hardcover" label

#### Scenario: Copy without a dust jacket
- **WHEN** the Bookshelf shows a copy not marked as having a dust jacket
- **THEN** its spine shows no dust jacket icon

### Requirement: Bookshelf owner can edit a tile's copy details
The system SHALL show the profile owner an edit control on each Bookshelf tile, and only the profile owner. It SHALL open the copy-details form for that tile's copy (per the book-collection capability's copy-details rules), pre-filled with the copy's current details. Saving SHALL update the tile, including its marks, without a page reload.

#### Scenario: Owner edits a tile
- **WHEN** the profile owner opens a tile's edit control, changes the printing from 2 to 1 on a first-edition Hardcover, and saves
- **THEN** the copy's details are updated and the tile's silver mark becomes a gold mark

#### Scenario: Owner edits an edition-less tile
- **WHEN** the profile owner opens the edit control on a tile for a work owned with no edition and sets its format to Ebook
- **THEN** that work's copy details are updated to Ebook

#### Scenario: Owner cancels an edit
- **WHEN** the profile owner opens a tile's edit control, changes a value, and closes the form without saving
- **THEN** the copy's details and the tile are unchanged

#### Scenario: Visitor sees no edit control
- **WHEN** a visitor who is not the profile owner views that profile's Bookshelf
- **THEN** no edit control is shown on any tile

### Requirement: Bookshelf can be filtered by copy details
The system SHALL let any visitor to the Bookshelf filter its tiles by:
- format: Paperback, Hardcover, Audiobook, Ebook or Not set, choosing any combination
- edition: any, first edition (edition 1), or later edition (edition 2 or more)
- printing: any, first printing (printing 1), or later printing (printing 2 or more)
- signed only
- dust jacket only
- limited editions only

Filters SHALL combine with each other and with the title search, so a tile is visible only if it matches all of them. A tile with no edition number SHALL NOT match a first or later edition filter, and a tile with no printing number SHALL NOT match a first or later printing filter. When filters and search together match nothing, the Bookshelf SHALL show its no-matches state. Series grouping SHALL apply after these filters, the same way it applies after the search.

#### Scenario: Filtering by format
- **WHEN** a visitor filters the Bookshelf to Hardcover
- **THEN** only tiles whose copy format is Hardcover remain visible

#### Scenario: Filtering to first edition, first printing
- **WHEN** a visitor sets the edition filter to first edition and the printing filter to first printing
- **THEN** only copies with edition 1 and printing 1 remain visible

#### Scenario: Filters combine with search
- **WHEN** a visitor filters to Paperback and searches for "Carrie"
- **THEN** only Paperback tiles whose work title matches "Carrie" remain visible

#### Scenario: Unknown values excluded by specific filters
- **WHEN** a visitor sets the printing filter to later printing
- **THEN** tiles with no printing number are hidden

#### Scenario: Filtering to signed copies
- **WHEN** a visitor turns on the signed-only filter
- **THEN** only tiles whose copy is marked signed remain visible

#### Scenario: Filtering to limited editions
- **WHEN** a visitor turns on the limited-editions-only filter
- **THEN** only tiles whose copy is marked as a limited edition remain visible

#### Scenario: Filters match nothing
- **WHEN** the active filters match no tile in the collection
- **THEN** the Bookshelf shows its no-matches state

## MODIFIED Requirements

### Requirement: Bookshelf heading shows the tile count
The system SHALL show, next to the Bookshelf heading, the total count of tiles in the profile owner's collection. The count SHALL NOT change when a search or any copy-details filter is applied to the Bookshelf.

#### Scenario: Heading count matches the collection
- **WHEN** a showcase's Bookshelf is displayed with a given number of tiles in the collection
- **THEN** the count shown next to the Bookshelf heading matches that number

#### Scenario: Heading count is unaffected by an active search
- **WHEN** a profile owner's Bookshelf search filters the visible tiles down to fewer than the full collection
- **THEN** the count shown next to the Bookshelf heading still reflects the full collection, not just the filtered tiles

#### Scenario: Heading count is unaffected by active copy-details filters
- **WHEN** a visitor's copy-details filters narrow the visible tiles down to fewer than the full collection
- **THEN** the count shown next to the Bookshelf heading still reflects the full collection
