# by-other-hands Specification

## Purpose

Gives fans a home for material connected to King's world but not written by him - Dark Tower comics/graphic novels, companion/reference books about his work, and authorized tie-in novels - browsable and personally trackable like a King book, while staying structurally separate from every King reading/collection statistic.

## Requirements

### Requirement: By Other Hands page lists non-King works
The system SHALL provide a page at `/works-by-others` listing every active By Other Hands work, visible to every visitor whether signed in or not. Each listed work SHALL show its title, creator(s), category, cover (if available), and its connection note.

#### Scenario: Visiting the By Other Hands page
- **WHEN** any visitor navigates to `/works-by-others`
- **THEN** the page shows every active By Other Hands work with its title, creator(s), category, cover, and connection note

#### Scenario: An inactive work is excluded
- **WHEN** a By Other Hands work's active flag is false
- **THEN** it does not appear on the page

### Requirement: Each listed work links to its own detail page
The system SHALL let any visitor navigate from a work's entry on the By Other Hands page to a dedicated detail page for that work, at `/works-by-others/<slug>`, showing at minimum its title, creator(s), category, cover, description, and connection note.

#### Scenario: Opening a work's detail page
- **WHEN** any visitor activates a By Other Hands work's entry on the listing page
- **THEN** they are taken to that work's own detail page showing its title, creator(s), category, cover, description, and connection note

### Requirement: By Other Hands detail page shows the same action controls as a King work detail page
The system SHALL present a signed-in user's owned/reading-status/editions controls on a By Other Hands work's detail page in the same expanded, one-button-per-action layout used on a King work's detail page, rather than the compact dropdown shown in the listing. This layout SHALL include a control to mark the work as read directly, available whenever the work is not already read.

#### Scenario: Detail page shows expanded controls
- **WHEN** a signed-in user views a By Other Hands work's detail page
- **THEN** its owned/reading-status controls are shown as separate buttons, the same layout as a King work's detail page

#### Scenario: Detail page offers a direct mark-as-read control
- **WHEN** a signed-in user views the detail page of a By Other Hands work that is not currently-reading and not already read
- **THEN** a control to mark it as read directly is shown among the expanded action buttons, not only reachable by first starting to read it

### Requirement: By Other Hands detail page shows aggregate stats
The system SHALL show, on a By Other Hands work's detail page, how many users currently have it marked currently-reading, want-to-read, read, and owned - the same stat figures shown on a King work's detail page, scoped to this work.

#### Scenario: Viewing a work's stats
- **WHEN** any visitor views a By Other Hands work's detail page
- **THEN** the page shows that work's currently-reading, want-to-read, read, and owned counts

### Requirement: By Other Hands works are grouped into three fixed categories
The system SHALL classify every By Other Hands work into exactly one of three categories: Dark Tower comics/graphic novels, companion/reference books, or authorized tie-in novels. The page SHALL let a visitor filter the list to a single category or view all categories together.

#### Scenario: Filtering to one category
- **WHEN** any visitor selects a single category filter on the By Other Hands page
- **THEN** only works in that category are shown

#### Scenario: Viewing all categories
- **WHEN** any visitor views the By Other Hands page with no category filter applied
- **THEN** works from all three categories are shown together

### Requirement: Signed-in user can mark a By Other Hands work owned
The system SHALL let a signed-in user mark a By Other Hands work as owned, or unmark it, with a single action.

#### Scenario: Marking a work owned
- **WHEN** a signed-in user activates the owned control on a By Other Hands work they do not own
- **THEN** the work becomes marked owned for that user

#### Scenario: Unmarking owned
- **WHEN** a signed-in user activates the owned control on a By Other Hands work they own
- **THEN** the work is no longer marked owned for that user

#### Scenario: Signed-out visitor's owned control opens the sign-in modal
- **WHEN** a signed-out visitor activates the owned control on a By Other Hands work
- **THEN** the sign-in/sign-up modal opens instead of marking it owned

### Requirement: Signed-in user can add a specific edition to a By Other Hands work
The system SHALL let a signed-in user pick a specific Open Library edition of a By Other Hands work to add to their collection, the same way they do for a King work's editions. Adding an edition SHALL mark that work owned for that user; removing a work's last remaining edition SHALL mark it no longer owned. The Add to Shelf control SHALL open this editions picker when the work has an Open Library work key, and SHALL fall back to a plain owned toggle when it does not.

#### Scenario: Adding an edition marks the work owned
- **WHEN** a signed-in user adds a specific edition of a By Other Hands work they do not own
- **THEN** that edition is recorded in their collection and the work becomes marked owned

#### Scenario: Removing a work's last edition un-owns it
- **WHEN** a signed-in user removes the only edition they have recorded for a By Other Hands work
- **THEN** that edition is removed from their collection and the work is no longer marked owned

#### Scenario: Add to Shelf opens the editions picker
- **WHEN** a signed-in user activates the Add to Shelf control on a By Other Hands work that has an Open Library work key
- **THEN** the editions picker for that work opens

### Requirement: By Other Hands works have no wishlist
The system SHALL NOT offer a wishlist state for By Other Hands works - only owned and reading-progress states apply (see the requirements above and below).

#### Scenario: No wishlist control is shown
- **WHEN** a signed-in user views a By Other Hands work's actions
- **THEN** no control for wishlisting it is shown

### Requirement: Signed-in user can track reading progress on a By Other Hands work
The system SHALL let a signed-in user mark a By Other Hands work as want-to-read, currently-reading (with a start date), or read (with a finish date), independent of whether they own it. These states SHALL follow the same invariants as King book reading status: marking currently-reading clears want-to-read, and marking read clears both want-to-read and currently-reading.

#### Scenario: Marking want-to-read
- **WHEN** a signed-in user marks a By Other Hands work as want-to-read
- **THEN** the work's want-to-read state becomes true for that user

#### Scenario: Starting to read clears want-to-read
- **WHEN** a signed-in user starts reading a By Other Hands work that was marked want-to-read
- **THEN** the work's want-to-read state becomes false and its currently-reading state becomes true with the supplied start date recorded

#### Scenario: Marking read clears want-to-read and currently-reading
- **WHEN** a signed-in user marks a By Other Hands work as read
- **THEN** the work's want-to-read and currently-reading states both become false, its read state becomes true, and the supplied finish date, if any, is recorded

#### Scenario: Signed-out visitor's reading-status controls open the sign-in modal
- **WHEN** a signed-out visitor activates a want-to-read, currently-reading, or read control on a By Other Hands work
- **THEN** the sign-in/sign-up modal opens instead of changing its reading status

### Requirement: Marking a work read can capture a date range, rating, format, and note
The system SHALL let a signed-in user optionally supply a start date, an end date, a personal rating (1-5), a format (physical, audiobook, or ebook), and a note (at most 200 characters) when marking a By Other Hands work read. These are the same fields King's mark-read flow collects, and each mark-read SHALL be recorded as its own logged read, the same as a King work's. All fields SHALL be independently skippable. When the work is already currently-reading, the prompt SHALL prefill the start date (and format, if one was captured when the work was started) with the values already recorded for that read.

#### Scenario: Marking read with dates, rating, format, and note supplied
- **WHEN** a signed-in user marks a By Other Hands work as read with a start date, an end date, a rating, a format, and a note all supplied
- **THEN** the work becomes read and a logged read is recorded with all five values

#### Scenario: Marking read with everything left blank
- **WHEN** a signed-in user marks a By Other Hands work as read with the dates, rating, format, and note all left blank
- **THEN** the work becomes read and a logged read is recorded with no dates, rating, format, or note

#### Scenario: Finishing a currently-reading work prefills its start date and format
- **WHEN** a signed-in user marks a currently-reading By Other Hands work as read
- **THEN** the mark-as-read prompt's start date is prefilled with the date already recorded when they started reading it, and its format is prefilled if one was captured then

#### Scenario: Reading a By Other Hands work again keeps the earlier read
- **WHEN** a signed-in user logs another read of a By Other Hands work they have already read
- **THEN** both reads are kept as separate logged reads, and the earlier read's dates, note, rating, and format are unchanged

### Requirement: An omnibus By Other Hands work collects other By Other Hands works
The system SHALL support marking a By Other Hands work as an omnibus that collects one or more other By Other Hands works (e.g. an omnibus edition collecting several individually-published comics), and SHALL show the collected works on the omnibus's detail page. Marking an omnibus work read SHALL also mark each work it collects as read; unmarking an omnibus work as read SHALL also unmark each work it collects as read, unless a collected work is also read on its own or via a different omnibus that remains marked read.

#### Scenario: Omnibus detail page shows what it collects
- **WHEN** any visitor views an omnibus By Other Hands work's detail page
- **THEN** the page lists every By Other Hands work it collects

#### Scenario: Marking an omnibus read cascades to its collected works
- **WHEN** a signed-in user marks an omnibus By Other Hands work as read
- **THEN** every By Other Hands work it collects also becomes marked read for that user

#### Scenario: Unmarking an omnibus read uncascades its collected works
- **WHEN** a signed-in user unmarks an omnibus By Other Hands work that was read, and a collected work was only read via that omnibus
- **THEN** that collected work is no longer marked read

#### Scenario: A collected work read on its own is unaffected by the omnibus being unmarked
- **WHEN** a signed-in user unmarks an omnibus By Other Hands work that was read, and a collected work was also marked read directly (not only via that omnibus)
- **THEN** that collected work remains marked read

### Requirement: Signed-in user sees their own By Other Hands completion count
The system SHALL show a signed-in user, on the By Other Hands page, how many By Other Hands works they have read out of the total active count. The system SHALL NOT show this to a signed-out visitor.

#### Scenario: Signed-in visitor views their completion count
- **WHEN** a signed-in user views the By Other Hands page
- **THEN** the page shows how many By Other Hands works they have read out of the total active count

#### Scenario: Signed-out visitor sees no completion count
- **WHEN** a signed-out visitor views the By Other Hands page
- **THEN** no completion count is shown

### Requirement: By Other Hands data never counts toward King reading or collection statistics
The system SHALL exclude every By Other Hands work, and every user's tracking of it, from King-specific statistics and recommendations, regardless of how a user has marked it owned, read, currently-reading, or want-to-read. This covers:
- per-work leaderboards and spotlights
- site-wide homepage counts
- bibliography category completion (all-works, Dark Tower, Bachman) and collection progress
- Dark Tower journey statistics
- every personalized book recommendation or suggestion
- the compare profiles page

A By Other Hands work's own detail page stats and the By Other Hands progress figures are the only statistics that count it.

#### Scenario: Reading a By Other Hands work does not change King completion
- **WHEN** a signed-in user marks a By Other Hands work as read
- **THEN** their King bibliography completion percentage (all-works, Dark Tower, and Bachman) is unchanged

#### Scenario: Owning a By Other Hands work does not change King ownership stats
- **WHEN** a signed-in user marks a By Other Hands work as owned
- **THEN** no King work's ownership count changes, and their collection progress is unchanged

#### Scenario: By Other Hands works never appear in King leaderboards
- **WHEN** any visitor views a most-read, currently-being-read, least-read, most-wanted, or most-owned King works leaderboard or spotlight
- **THEN** no By Other Hands work appears in it

#### Scenario: By Other Hands works are never recommended
- **WHEN** a signed-in user wants to read, owns without reading, or has a Dark Tower flag on a By Other Hands work
- **THEN** no book recommendation, gift idea, or next-book suggestion anywhere in the app names that work

#### Scenario: The compare page ignores By Other Hands works
- **WHEN** a signed-in user compares their profile with another profile, and either of them has read or owns By Other Hands works
- **THEN** no progress card, total activity figure, or read/owned difference list on the compare page includes or counts any By Other Hands work

#### Scenario: A Dark Tower comic does not change Dark Tower journey stats
- **WHEN** a user marks a Dark Tower By Other Hands work as read
- **THEN** the Dark Tower page's finished, on-the-way, and not-started counts are unchanged

### Requirement: Primary navigation links to the By Other Hands page
The system SHALL include a link to `/works-by-others` in primary navigation, reachable from anywhere in the app.

#### Scenario: Navigating from primary navigation
- **WHEN** any visitor activates the By Other Hands link in primary navigation
- **THEN** they are taken to `/works-by-others`

### Requirement: By Other Hands pages only show related works
The system SHALL show only works labelled `related` on `/works-by-others` and its detail pages. The slug of a King work SHALL resolve on `/works-by-others/<slug>` the same as a slug matching no work.

#### Scenario: The listing never shows a King work
- **WHEN** any visitor views `/works-by-others`
- **THEN** no King work appears in the list

#### Scenario: A King work's slug on the By Other Hands detail route
- **WHEN** a visitor navigates to `/works-by-others/<slug>` where the slug belongs to a King work
- **THEN** the system shows a not-found result instead of a detail page

### Requirement: Existing By Other Hands data is preserved when storage is merged
The system SHALL carry every existing By Other Hands work, and every user's owned status, reading status, recorded editions, read details (dates, note, rating, format), and reports against it, into the merged works storage unchanged. Each work keeps its id and slug, so existing links and shared URLs keep working.

#### Scenario: A user's tracking survives the merge
- **WHEN** the merged storage is released and a user had a By Other Hands work marked owned, read with a finish date, note, and rating, and with one recorded edition
- **THEN** after the release that work is still owned, still read with the same finish date, note, and rating on its logged read, and still shows that edition on their shelf

#### Scenario: A currently-reading work survives the merge
- **WHEN** the merged storage is released and a user was currently reading a By Other Hands work with a start date and format
- **THEN** after the release it is still currently-reading with the same start date and format

#### Scenario: An omnibus-cascaded read survives without a timeline entry
- **WHEN** the merged storage is released and a user had a comic marked read only because an omnibus containing it was marked read
- **THEN** after the release that comic is still marked read via that omnibus, and it still has no reading timeline entry of its own

#### Scenario: A report against a By Other Hands work survives the merge
- **WHEN** the merged storage is released and a report had been filed against a By Other Hands work
- **THEN** after the release the report still names and links to that work

### Requirement: Signed-in user sees their own graphic novel completion count
The system SHALL show a signed-in user, on the By Other Hands page, how many graphic novels they have read out of the total. The total SHALL cover every active By Other Hands work in the comic category, Dark Tower or not. Omnibuses are left out, since reading one marks the comics it collects as read and those are already counted. The system SHALL NOT show this to a signed-out visitor.

#### Scenario: Signed-in visitor views their graphic novel count
- **WHEN** a signed-in user views the By Other Hands page
- **THEN** the page shows how many active comics (excluding omnibuses) they have read out of the total number of active comics (excluding omnibuses)

#### Scenario: Reading an omnibus counts its comics, not the omnibus
- **WHEN** a signed-in user marks a comic omnibus read, and it collects comics they had not read
- **THEN** the graphic novel count goes up by the number of newly read comics it collects, and its total is unchanged

#### Scenario: Signed-out visitor sees no graphic novel count
- **WHEN** a signed-out visitor views the By Other Hands page
- **THEN** no graphic novel count is shown

### Requirement: By Other Hands list is filterable by read status for signed-in users
The system SHALL show a signed-in user a read-status filter on the `/works-by-others` page, choosing between "All", "Read", and "Unread". Selecting "Read" restricts the visible items to By Other Hands works the user has marked read at least once; selecting "Unread" restricts the visible items to By Other Hands works the user has never marked read (including works they own or are currently reading but have not finished); selecting "All" applies no restriction based on read status. The filter SHALL default to "All" each time the page loads, and SHALL combine with the page's title search and category filter so only works satisfying every active constraint are shown. The system SHALL NOT show the read-status filter to a signed-out visitor, and SHALL NOT apply any read-status restriction for a signed-out visitor.

#### Scenario: Filtering to read By Other Hands works
- **WHEN** a signed-in user selects "Read" in the read-status filter on `/works-by-others`
- **THEN** the list shows only By Other Hands works the user has marked read

#### Scenario: Filtering to unread By Other Hands works
- **WHEN** a signed-in user selects "Unread" in the read-status filter on `/works-by-others`
- **THEN** the list shows only By Other Hands works the user has not marked read

#### Scenario: Combining the read-status filter with search and category
- **WHEN** a signed-in user has a search term, a category filter, and a read-status selection other than "All" active
- **THEN** the list shows only By Other Hands works that match the search term, the selected category, and the selected read status at once

#### Scenario: Read-status filter defaults to All
- **WHEN** a signed-in user loads `/works-by-others`
- **THEN** the read-status filter is set to "All" and no work is hidden because of its read status

#### Scenario: Signed-out visitor sees no read-status filter
- **WHEN** a signed-out visitor views `/works-by-others`
- **THEN** no read-status filter is shown and the list is not restricted by read status
