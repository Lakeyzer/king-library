## ADDED Requirements

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

## MODIFIED Requirements

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
