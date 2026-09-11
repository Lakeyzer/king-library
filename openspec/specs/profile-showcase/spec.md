# profile-showcase Specification

## Purpose

Gives every user a flashy, shareable dashboard of their Stephen King reading and viewing achievements — reading progress by category, adaptation viewing progress, what they're currently reading, and how much of the bibliography they own.

## Requirements

### Requirement: Own showcase requires sign-in and a username
The system SHALL only allow a signed-in user with a username set to view their own showcase, redirecting a signed-out visitor to sign in and a signed-in user without a username to onboarding, consistent with how the account settings page is gated.

#### Scenario: Signed-out visitor tries to view their own showcase
- **WHEN** a signed-out visitor navigates to their own showcase page
- **THEN** they are not shown dashboard content and are directed to sign in

#### Scenario: Signed-in user without a username tries to view their own showcase
- **WHEN** a signed-in user with no username set navigates to their own showcase page
- **THEN** they are redirected to the onboarding page instead of seeing the dashboard

### Requirement: Showcase reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's showcase by that user's username when the profile is public, resolving the username case-insensitively so any letter casing of a valid username reaches the same profile.

#### Scenario: A signed-in user views another public profile's showcase
- **WHEN** a signed-in user navigates to the showcase of another user whose profile is public
- **THEN** they see that user's dashboard

#### Scenario: A signed-out visitor views a public profile's showcase
- **WHEN** a signed-out visitor navigates to the showcase of a user whose profile is public
- **THEN** they see that user's dashboard without being asked to sign in

#### Scenario: Requesting a username that matches no profile
- **WHEN** a visitor navigates to a showcase URL for a username that matches no profile
- **THEN** they receive an indication that no such profile exists

#### Scenario: Visiting a showcase URL with different letter casing
- **WHEN** a visitor navigates to a showcase URL using different letter casing than the profile's stored username
- **THEN** they see the same profile's showcase as the canonical lowercase URL would show

### Requirement: Showcase shows the owner's tagline when set
The system SHALL display the profile owner's tagline on their Showcase, in place of the static "Stephen King reading showcase" subtitle, whenever a tagline is set, and SHALL show the static subtitle instead whenever no tagline is set.

#### Scenario: Owner has a tagline set
- **WHEN** a showcase is displayed for a profile owner who has set a tagline
- **THEN** the tagline is shown in place of the static "Stephen King reading showcase" subtitle

#### Scenario: Owner has no tagline set
- **WHEN** a showcase is displayed for a profile owner who has not set a tagline
- **THEN** the static "Stephen King reading showcase" subtitle is shown

### Requirement: Shareable showcase URL uses lowercase username
The system SHALL build the showcase's shareable URL using the fully lowercase form of the username, regardless of the letter case stored on the profile.

#### Scenario: Sharing a profile with a mixed-case username
- **WHEN** the owner activates "Share" on a showcase whose username contains uppercase letters
- **THEN** the URL copied or shared uses the fully lowercase form of the username

### Requirement: Non-owner visitor can follow or unfollow the profile owner
The system SHALL show a follow control on a showcase to a visitor who is not the profile's owner, reflecting whether the visitor currently follows the profile owner, and letting them toggle that state. The system SHALL route a signed-out visitor who activates the control to sign in instead of following.

#### Scenario: Signed-in visitor follows the profile owner
- **WHEN** a signed-in visitor who does not yet follow the profile owner activates the follow control
- **THEN** they begin following the profile owner and the control reflects the followed state

#### Scenario: Signed-in visitor unfollows the profile owner
- **WHEN** a signed-in visitor who already follows the profile owner activates the control
- **THEN** they stop following the profile owner and the control reflects the not-followed state

#### Scenario: Signed-out visitor activates the follow control
- **WHEN** a signed-out visitor activates the follow control on a showcase
- **THEN** they are directed to sign in instead of following anyone

### Requirement: Private profile hides showcase data from other visitors
The system SHALL show a "this profile is private" state, instead of the dashboard, to any visitor who is not the profile's owner when that profile is private.

#### Scenario: Visiting another user's private showcase
- **WHEN** a visitor who is not the profile owner navigates to the showcase of a user whose profile is private
- **THEN** they see a "this profile is private" state instead of reading/viewing/collection data

#### Scenario: Owner viewing their own private showcase by username
- **WHEN** the profile owner navigates to their own showcase (whether at their own dashboard or by their own username) while their profile is private
- **THEN** they see their full dashboard, not the private notice

### Requirement: Reading progress bars for overall, Bachman, and Dark Tower
The system SHALL display, on a showcase, three reading-progress indicators: overall progress (the profile owner's count of King works marked read out of all King works), Bachman progress (count of Bachman-flagged King works marked read out of all Bachman-flagged King works), and Dark Tower progress (count of Dark-Tower-flagged King works marked read out of all Dark-Tower-flagged King works).

#### Scenario: Overall progress reflects total read count
- **WHEN** a showcase is displayed for a profile owner who has marked some King works read
- **THEN** the overall progress indicator shows their read count out of the total number of King works

#### Scenario: Bachman progress counts only Bachman-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Bachman progress indicator's read count and total are both restricted to King works with the Bachman flag set

#### Scenario: Dark Tower progress counts only Dark-Tower-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Dark Tower progress indicator's read count and total are both restricted to King works with the Dark Tower flag set

### Requirement: Adaptation viewing progress
The system SHALL display, on a showcase, a viewing-progress indicator showing the profile owner's count of adaptations marked watched out of the total number of adaptations.

#### Scenario: Viewing progress reflects watched count
- **WHEN** a showcase is displayed for a profile owner who has marked some adaptations watched
- **THEN** the viewing-progress indicator shows their watched count out of the total number of adaptations

### Requirement: Currently Reading section shows in-progress works
The system SHALL display, on a showcase, cover art for every King work the profile owner currently has marked currently-reading, and SHALL display an empty state when none are currently-reading.

#### Scenario: One work currently reading
- **WHEN** a showcase is displayed for a profile owner with exactly one King work marked currently-reading
- **THEN** the Currently Reading section shows that work's cover art

#### Scenario: Multiple works currently reading
- **WHEN** a showcase is displayed for a profile owner with more than one King work marked currently-reading
- **THEN** the Currently Reading section shows cover art for all of them

#### Scenario: No works currently reading
- **WHEN** a showcase is displayed for a profile owner with no King work marked currently-reading
- **THEN** the Currently Reading section shows an empty state instead of any cover art

### Requirement: Collection progress is a non-interactive indicator
The system SHALL display, on a showcase, a collection-progress indicator showing the profile owner's count of King works marked owned out of the total number of King works, and SHALL NOT navigate anywhere when activated.

#### Scenario: Collection progress reflects owned count
- **WHEN** a showcase is displayed for a profile owner who has marked some King works owned
- **THEN** the collection-progress indicator shows their owned count out of the total number of King works

#### Scenario: Collection progress does not navigate
- **WHEN** a visitor activates the collection-progress indicator
- **THEN** no navigation occurs

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
The system SHALL let a visitor sort the Bookshelf's tiles by the owning King work's title or its release year, in either ascending or descending order. When series grouping is enabled, this sort determines the order of series (as units) and standalone tiles relative to each other, but not the order of tiles within a grouped series — see "Grouped series tiles keep their series reading order."

#### Scenario: Sorting by title
- **WHEN** a visitor sorts the Bookshelf by title
- **THEN** tiles are ordered alphabetically by their King work's title

#### Scenario: Sorting by release year
- **WHEN** a visitor sorts the Bookshelf by release year
- **THEN** tiles are ordered by their King work's release year

#### Scenario: Reversing sort direction
- **WHEN** a visitor toggles the Bookshelf's sort direction
- **THEN** the tile order reverses

### Requirement: Bookshelf can be grouped by series
The system SHALL show a "Group series" checkbox among the Bookshelf's controls, shown whenever the collection is non-empty, unchecked by default, which lets a visitor toggle whether tiles belonging to the same series are grouped together.

#### Scenario: Grouping is off by default
- **WHEN** a visitor first views a Bookshelf
- **THEN** the "Group series" checkbox is unchecked and tiles are not grouped by series

#### Scenario: Enabling grouping
- **WHEN** a visitor checks "Group series"
- **THEN** tiles belonging to the same series are grouped together in the Bookshelf grid

#### Scenario: Disabling grouping
- **WHEN** a visitor unchecks "Group series" after enabling it
- **THEN** tiles return to their ungrouped order and column placement

### Requirement: Grouped series tiles keep their series reading order
The system SHALL, when series grouping is enabled, order the tiles of a grouped series by that series' reading-order position rather than by the Bookshelf's active sort field, using only the series' member works that are present in the collection.

#### Scenario: Sorting by title with grouping enabled
- **WHEN** a visitor sorts the Bookshelf by title with "Group series" checked
- **THEN** tiles within a grouped series appear in series reading order rather than alphabetically

#### Scenario: Sorting by release year with grouping enabled
- **WHEN** a visitor sorts the Bookshelf by release year with "Group series" checked
- **THEN** tiles within a grouped series appear in series reading order rather than by release year

#### Scenario: Only some of a series' works are in the collection
- **WHEN** a profile owner's collection contains some, but not all, of a series' member works, and grouping is enabled
- **THEN** the series group contains only the works present in the collection, ordered by their series reading order

### Requirement: Grouping leaves standalone tiles individually sorted
The system SHALL, when series grouping is enabled, continue to order tiles for King works that belong to no series individually by the Bookshelf's active sort field, rather than treating them as part of any group.

#### Scenario: Mixed collection with grouping enabled
- **WHEN** a profile owner's collection includes both series and standalone works and "Group series" is checked
- **THEN** standalone tiles are ordered individually by the active sort field while series tiles cluster together

### Requirement: A grouped series flows contiguously through the masonry grid
The system SHALL, when series grouping is enabled, place a grouped series' tiles at consecutive positions in the Bookshelf's tile ordering, assigned to columns by the same left-to-right, wrap-to-next-row placement used when ungrouped, rather than confining the series to a single column.

#### Scenario: A grouped series with more members than columns
- **WHEN** a series has more tiles in the collection than the Bookshelf's current column count, and grouping is enabled
- **THEN** that series' tiles fill across columns left to right and continue on the next row, in the same left-to-right, wrapping placement as any other run of consecutive tiles, rather than stacking within one column

#### Scenario: Grouping disabled restores independent column assignment
- **WHEN** a visitor unchecks "Group series"
- **THEN** tiles are assigned to columns independently of series membership, as in the ungrouped behavior

### Requirement: Grouping applies after the active search filter
The system SHALL, when series grouping is enabled, apply grouping only to the tiles remaining after the Bookshelf's search filter, so a series with only some members matching the search groups only those matching tiles.

#### Scenario: Search narrows a grouped series to one match
- **WHEN** a visitor's search term matches only one work in a series that has multiple works in the collection, and "Group series" is checked
- **THEN** the Bookshelf shows only the matching tile, without the rest of that series

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

### Requirement: Currently Reading items support finishing directly from the showcase
The system SHALL let the profile owner finish a King work shown in the Currently Reading section directly from the showcase, using the same finish-reading flow (an end date, defaulted to today and adjustable) defined by the reading-status capability, without navigating away from the showcase. The system SHALL NOT show this action to a visitor who is not the profile owner.

#### Scenario: Finishing a currently-reading work from the showcase
- **WHEN** the profile owner activates the finish action on a work in their Currently Reading section
- **THEN** they are prompted for an end date the same way as elsewhere in the app, and confirming it marks that work as read and removes it from the Currently Reading section

#### Scenario: Visitor viewing another user's showcase does not see a finish action
- **WHEN** a visitor who is not the profile owner views that profile's Currently Reading section
- **THEN** no finish action is shown for any item

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
