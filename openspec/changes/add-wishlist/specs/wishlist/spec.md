## Purpose

Lets a user keep a collector's shopping list of works they are hunting for, King works and Works by Others alike. Each entry carries a note and tags that describe what exactly they want (a first printing, a signed copy, a better-condition upgrade), and the list can be filtered by tag and shown publicly on their profile.

## ADDED Requirements

### Requirement: Signed-in user can add a work to their wishlist with a note and tags
The system SHALL let a signed-in user add a wishlist entry for any active work, King works and Works by Others alike. Each entry SHALL have an optional free-text note of at most 1000 characters and zero or more tags, with at most 10 tags per entry. Adding an entry SHALL NOT require choosing a specific edition.

#### Scenario: Adding an entry with a note and tags
- **WHEN** a signed-in user adds a wishlist entry for a work with the note "Have 1st/2nd printing, want true 1st" and the tags `hardcover` and `first-printing`
- **THEN** the entry is saved against that work with that note and those two tags

#### Scenario: Adding an entry with no note and no tags
- **WHEN** a signed-in user adds a wishlist entry for a work without entering a note or picking a tag
- **THEN** the entry is saved against that work with an empty note and no tags

#### Scenario: Adding a Works by Others work
- **WHEN** a signed-in user adds a wishlist entry for a By Other Hands work
- **THEN** the entry is saved the same way as for a King work

#### Scenario: Note exceeds the length limit
- **WHEN** a signed-in user tries to save a wishlist entry whose note is longer than 1000 characters
- **THEN** the entry is not saved and the user is told the note is too long

#### Scenario: Too many tags
- **WHEN** a signed-in user tries to save a wishlist entry with more than 10 tags
- **THEN** the entry is not saved and the user is told the tag limit

### Requirement: A work can have multiple wishlist entries
The system SHALL let a user hold more than one wishlist entry for the same work, each with its own note and tags, independent of the others.

#### Scenario: Adding a second entry for the same work
- **WHEN** a signed-in user who already has a wishlist entry for a work adds another entry for that work with different tags
- **THEN** both entries exist for that work, each keeping its own note and tags

### Requirement: Wishlist tags come from a predefined list or are custom
The system SHALL offer these predefined tags when adding or editing a wishlist entry: `any`, `paperback`, `trade-paperback`, `mass-market-paperback`, `hardcover`, `first-edition`, `first-printing`, `signed`, `limited-edition`, `better-condition`, `dust-jacket`, `audiobook`, `ebook`, `foreign-edition`, `book-club-edition`. The system SHALL also let the user enter a custom tag. Every tag, predefined or custom, SHALL be stored in normalized form: lowercase, with runs of spaces, underscores and other non-alphanumeric characters collapsed to a single hyphen, and no leading or trailing hyphen. A normalized tag SHALL be 1 to 30 characters long. Duplicate tags on one entry SHALL collapse to one. Each tag SHALL be displayed with a human-readable label (for example `first-printing` shows as "First printing").

#### Scenario: Picking a predefined tag
- **WHEN** a signed-in user opens the tag input on a wishlist entry
- **THEN** every predefined tag is offered as a suggestion

#### Scenario: Entering a custom tag
- **WHEN** a signed-in user enters the custom tag "Cemetery Dance"
- **THEN** the entry is saved with the tag `cemetery-dance`

#### Scenario: Custom tag that normalizes to a predefined tag
- **WHEN** a signed-in user enters the custom tag "First Printing"
- **THEN** it is saved as the predefined tag `first-printing`, not as a separate tag

#### Scenario: Custom tag that normalizes to nothing
- **WHEN** a signed-in user enters a custom tag made only of punctuation or spaces
- **THEN** no tag is added

#### Scenario: Custom tag too long
- **WHEN** a signed-in user enters a custom tag that is longer than 30 characters after normalization
- **THEN** the tag is not added and the user is told the length limit

#### Scenario: Previously used custom tags are suggested
- **WHEN** a signed-in user who has used a custom tag on one of their wishlist entries opens the tag input on another entry
- **THEN** that custom tag is offered as a suggestion alongside the predefined tags

### Requirement: Signed-in user can edit and remove their wishlist entries
The system SHALL let a signed-in user change the note and tags of any of their own wishlist entries, and remove any of their own entries, without affecting their other entries for the same work.

#### Scenario: Editing an entry
- **WHEN** a signed-in user changes the note and tags of one of their wishlist entries and saves
- **THEN** that entry shows the new note and tags

#### Scenario: Removing one of several entries for a work
- **WHEN** a signed-in user removes one of two wishlist entries they have for a work
- **THEN** only that entry is removed and the other remains

### Requirement: Wishlist is independent of ownership and reading status
The system SHALL keep wishlist entries independent of whether the user owns the work, which editions they have on their shelf, and their reading status. Marking a work owned, adding or removing an edition, or changing reading status SHALL NOT add, change or remove wishlist entries, and having wishlist entries SHALL NOT change ownership or reading status.

#### Scenario: Wishlisting an owned work
- **WHEN** a signed-in user who owns a work adds a wishlist entry for it tagged `better-condition`
- **THEN** the entry is saved and the work stays owned

#### Scenario: Acquiring a wishlisted work
- **WHEN** a signed-in user adds an edition of a work to their shelf while that work has wishlist entries
- **THEN** the work becomes owned and its wishlist entries remain unchanged

### Requirement: Wishlist control on the book actions component
The system SHALL show a wishlist control among a work's book actions, in both the compact and the expanded form, for King works and Works by Others. The control SHALL show whether the viewer has any wishlist entries for the work, and how many. Activating it SHALL open a dialog that lists the viewer's existing entries for that work, each editable and removable, and lets them add a new entry. A signed-out visitor who activates the control SHALL be directed to sign in instead.

#### Scenario: Opening the wishlist dialog for a work with no entries
- **WHEN** a signed-in user with no wishlist entries for a work activates that work's wishlist control
- **THEN** a dialog opens with a form for a new entry's note and tags

#### Scenario: Control reflects existing entries
- **WHEN** a signed-in user has two wishlist entries for a work and views that work's book actions
- **THEN** the wishlist control indicates the work is on their wishlist with 2 entries

#### Scenario: Managing existing entries from the dialog
- **WHEN** a signed-in user with wishlist entries for a work opens that work's wishlist dialog
- **THEN** the dialog lists those entries, each with controls to edit and remove it, plus a control to add another entry

#### Scenario: Signed-out visitor activates the wishlist control
- **WHEN** a signed-out visitor activates a work's wishlist control
- **THEN** the sign-in/sign-up modal opens instead of the wishlist dialog

### Requirement: Profile Wishlist tab lists the owner's wishlist entries
The system SHALL show, on a profile's Wishlist tab, every wishlist entry of the profile owner whose work is active, King works and Works by Others alike. Each entry SHALL show the work's cover and title, the note (when set) and the tags. Entries SHALL be ordered most recently added first. Each work title SHALL link to that work's detail page: a King work's page for King works, and the By Other Hands detail page for Works by Others. The tab SHALL show an empty state when there are no entries to show, worded for the owner or for a visitor as appropriate.

#### Scenario: Owner has wishlist entries
- **WHEN** a Wishlist tab is displayed for an owner with wishlist entries for active works
- **THEN** every one of those entries is shown with its work, note and tags, most recently added first

#### Scenario: Multiple entries for the same work
- **WHEN** a Wishlist tab is displayed for an owner with two entries for the same work
- **THEN** both entries are shown, each with its own note and tags

#### Scenario: Entry for a Works by Others work links to its detail page
- **WHEN** a visitor selects the title of a By Other Hands work on a Wishlist tab
- **THEN** they are taken to that work's By Other Hands detail page

#### Scenario: Entry for an inactive work
- **WHEN** a work with an entry on the owner's wishlist is marked inactive
- **THEN** that entry no longer appears on the Wishlist tab

#### Scenario: Empty wishlist
- **WHEN** a Wishlist tab is displayed for an owner with no entries for active works
- **THEN** an empty state is shown instead of entries

### Requirement: Wishlist tab can be filtered by tag
The system SHALL let any visitor to a Wishlist tab filter its entries by tag. The tags offered SHALL be exactly the tags present on the entries shown. When one or more tags are selected, only entries carrying every selected tag SHALL be shown. Clearing the selection SHALL show all entries again.

#### Scenario: Filtering by one tag
- **WHEN** a visitor selects the `first-printing` tag filter on a Wishlist tab
- **THEN** only entries tagged `first-printing` are shown

#### Scenario: Filtering by several tags
- **WHEN** a visitor selects both `hardcover` and `signed` on a Wishlist tab
- **THEN** only entries tagged both `hardcover` and `signed` are shown

#### Scenario: No entry matches the filter
- **WHEN** a visitor selects a combination of tags that no entry carries all of
- **THEN** a no-results state is shown with a way to clear the filter

#### Scenario: Only tags in use are offered
- **WHEN** a Wishlist tab is displayed whose entries use only the tags `hardcover` and `signed`
- **THEN** only `hardcover` and `signed` are offered as filters

### Requirement: Only the owner can change entries from the Wishlist tab
The system SHALL show edit and remove controls on each Wishlist tab entry only when the viewer is the profile owner. Other visitors SHALL see entries read-only. The system SHALL reject any attempt to add, change or remove another user's wishlist entries.

#### Scenario: Owner edits an entry from the tab
- **WHEN** the profile owner activates the edit control on an entry on their own Wishlist tab and saves a new note
- **THEN** the entry shows the new note

#### Scenario: Visitor sees entries read-only
- **WHEN** a visitor who is not the profile owner views a public profile's Wishlist tab
- **THEN** no edit or remove controls are shown on any entry

#### Scenario: Writing another user's entry is refused
- **WHEN** a signed-in user attempts to change or remove a wishlist entry that belongs to another user
- **THEN** the change is refused and the entry is unchanged

### Requirement: Wishlist visibility follows the profile privacy setting
The system SHALL make a user's wishlist entries readable by anyone, including signed-out visitors, when that user's profile is public, and readable only by the owner when it is private. This SHALL be enforced by the data layer, not only by hiding the tab.

#### Scenario: Signed-out visitor views a public profile's wishlist
- **WHEN** a signed-out visitor navigates to the Wishlist tab of a public profile
- **THEN** they see that profile's wishlist entries without being asked to sign in

#### Scenario: Visitor views a private profile's wishlist
- **WHEN** a visitor who is not the owner navigates to the Wishlist tab of a private profile
- **THEN** they see the "this profile is private" state, and no wishlist entries of that user can be read

#### Scenario: Owner views their own private wishlist
- **WHEN** the owner of a private profile views their own Wishlist tab
- **THEN** they see all of their wishlist entries

### Requirement: Own Wishlist tab requires sign-in
The system SHALL only allow a signed-in user to view their own Wishlist tab (the shortcut route, not the by-username route), directing a signed-out visitor to sign in, consistent with the other own-profile tabs.

#### Scenario: Signed-out visitor opens their own Wishlist tab
- **WHEN** a signed-out visitor navigates to the own-profile Wishlist route
- **THEN** no wishlist entries are shown and they are directed to sign in
