## MODIFIED Requirements

### Requirement: Collection progress is a non-interactive indicator
The system SHALL display, on a showcase, a collection-progress indicator showing the profile owner's count of King works marked owned out of the total number of King works, and SHALL NOT navigate anywhere when activated.

#### Scenario: Collection progress reflects owned count
- **WHEN** a showcase is displayed for a profile owner who has marked some King works owned
- **THEN** the collection-progress indicator shows their owned count out of the total number of King works

#### Scenario: Collection progress does not navigate
- **WHEN** a visitor activates the collection-progress indicator
- **THEN** no navigation occurs

## ADDED Requirements

### Requirement: Bookshelf shows the profile owner's collection
The system SHALL display, on a showcase, a Bookshelf grid with one tile for each edition the profile owner has added to their collection, plus one tile (using the work's fallback cover) for each King work the profile owner has marked owned with no edition added. The system SHALL display an empty state when the collection is empty.

#### Scenario: Collection with editions and edition-less owned works
- **WHEN** a showcase is displayed for a profile owner who has added editions for some King works and marked others owned without picking an edition
- **THEN** the Bookshelf shows a tile for every added edition and a fallback-cover tile for every edition-less owned work

#### Scenario: Empty collection
- **WHEN** a showcase is displayed for a profile owner with nothing in their collection
- **THEN** the Bookshelf shows an empty state instead of any tiles

### Requirement: Bookshelf heading shows the tile count
The system SHALL show, next to the Bookshelf heading, the total count of tiles in the profile owner's collection, independent of any search filter applied to the Bookshelf.

#### Scenario: Heading count matches the collection
- **WHEN** a showcase's Bookshelf is displayed with a given number of tiles in the collection
- **THEN** the count shown next to the Bookshelf heading matches that number

#### Scenario: Heading count is unaffected by an active search
- **WHEN** a profile owner's Bookshelf search filters the visible tiles down to fewer than the full collection
- **THEN** the count shown next to the Bookshelf heading still reflects the full collection, not just the filtered tiles

### Requirement: Bookshelf uses a responsive masonry grid
The system SHALL lay out the Bookshelf as a masonry grid, showing 2 columns at the smallest supported viewport width and 5 columns at the largest.

#### Scenario: Smallest supported viewport
- **WHEN** a showcase is displayed at the smallest supported viewport width
- **THEN** the Bookshelf grid shows 2 columns

#### Scenario: Largest viewport
- **WHEN** a showcase is displayed at the largest viewport width
- **THEN** the Bookshelf grid shows 5 columns

### Requirement: Bookshelf can be searched by title
The system SHALL let a visitor filter the Bookshelf's tiles by matching text against the owning King work's title.

#### Scenario: Searching narrows the shelf
- **WHEN** a visitor enters a search term in the Bookshelf's search field
- **THEN** only tiles whose King work title matches the term remain visible

#### Scenario: Search matches nothing
- **WHEN** a visitor's Bookshelf search term matches no tile in the collection
- **THEN** the Bookshelf shows a no-matches state instead of any tiles

### Requirement: Bookshelf can be sorted by title or release year
The system SHALL let a visitor sort the Bookshelf's tiles by the owning King work's title or its release year, in either ascending or descending order.

#### Scenario: Sorting by title
- **WHEN** a visitor sorts the Bookshelf by title
- **THEN** tiles are ordered alphabetically by their King work's title

#### Scenario: Sorting by release year
- **WHEN** a visitor sorts the Bookshelf by release year
- **THEN** tiles are ordered by their King work's release year

#### Scenario: Reversing sort direction
- **WHEN** a visitor toggles the Bookshelf's sort direction
- **THEN** the tile order reverses

### Requirement: Bookshelf owner can remove a tile, with confirmation
The system SHALL show the profile owner a remove control on each Bookshelf tile, shown only to the profile owner, which asks for confirmation before removing that item from their collection (per the book-collection capability's edition and edition-less-work removal behavior).

#### Scenario: Owner removes a tile after confirming
- **WHEN** the profile owner activates a Bookshelf tile's remove control and confirms the prompt
- **THEN** that item is removed from their collection and its tile no longer appears on the Bookshelf

#### Scenario: Owner cancels the remove confirmation
- **WHEN** the profile owner activates a Bookshelf tile's remove control and cancels the prompt instead of confirming
- **THEN** the item remains in their collection and its tile stays on the Bookshelf

#### Scenario: Visitor viewing another user's Bookshelf sees no remove control
- **WHEN** a visitor who is not the profile owner views that profile's Bookshelf
- **THEN** no remove control is shown on any tile

### Requirement: Owner sees a personalized owned-unread book recommendation
The system SHALL show the profile owner a recommendation for one King work they own but have not read. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a visitor who is not the profile owner, even when the profile is public.

#### Scenario: Owner with an eligible recommendation
- **WHEN** the profile owner owns a King work they have not read
- **THEN** their showcase recommends one such King work

#### Scenario: Owner with no eligible recommendation
- **WHEN** the profile owner owns no King work they have not read
- **THEN** no owned-unread recommendation card is shown

#### Scenario: Visitor viewing another user's showcase sees no owned-unread recommendation
- **WHEN** a visitor who is not the profile owner views that profile's showcase, public or private
- **THEN** no owned-unread recommendation card is shown
