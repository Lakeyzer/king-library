## MODIFIED Requirements

### Requirement: Reading progress bars for overall, Bachman, and Dark Tower
The system SHALL display, on a showcase, three reading-progress indicators: overall progress (the profile owner's count of active King works marked read out of all active King works), Bachman progress (count of active Bachman-flagged King works marked read out of all active Bachman-flagged King works), and Dark Tower progress (count of active Dark-Tower-flagged King works marked read out of all active Dark-Tower-flagged King works). Inactive King works SHALL be excluded from both the read count and the total in every indicator.

#### Scenario: Overall progress reflects total read count
- **WHEN** a showcase is displayed for a profile owner who has marked some active King works read
- **THEN** the overall progress indicator shows their read count out of the total number of active King works

#### Scenario: Bachman progress counts only Bachman-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Bachman progress indicator's read count and total are both restricted to active King works with the Bachman flag set

#### Scenario: Dark Tower progress counts only Dark-Tower-flagged works
- **WHEN** a showcase is displayed
- **THEN** the Dark Tower progress indicator's read count and total are both restricted to active King works with the Dark Tower flag set

#### Scenario: An inactive work is excluded from progress
- **WHEN** a profile owner has read a King work that is later marked inactive
- **THEN** that work no longer contributes to the read count or the total of any progress indicator

### Requirement: Adaptation viewing progress
The system SHALL display, on a showcase, a viewing-progress indicator showing the profile owner's count of active adaptations marked watched out of the total number of active adaptations. Inactive adaptations SHALL be excluded from both the watched count and the total.

#### Scenario: Viewing progress reflects watched count
- **WHEN** a showcase is displayed for a profile owner who has marked some active adaptations watched
- **THEN** the viewing-progress indicator shows their watched count out of the total number of active adaptations

#### Scenario: An inactive adaptation is excluded from progress
- **WHEN** a profile owner has watched an adaptation that is later marked inactive
- **THEN** that adaptation no longer contributes to the watched count or the total

### Requirement: Currently Reading section shows in-progress works
The system SHALL display, on a showcase, cover art for every active King work the profile owner currently has marked currently-reading, and SHALL display an empty state when none are currently-reading. Inactive King works SHALL be excluded even if marked currently-reading.

#### Scenario: One work currently reading
- **WHEN** a showcase is displayed for a profile owner with exactly one active King work marked currently-reading
- **THEN** the Currently Reading section shows that work's cover art

#### Scenario: Multiple works currently reading
- **WHEN** a showcase is displayed for a profile owner with more than one active King work marked currently-reading
- **THEN** the Currently Reading section shows cover art for all of them

#### Scenario: No works currently reading
- **WHEN** a showcase is displayed for a profile owner with no active King work marked currently-reading
- **THEN** the Currently Reading section shows an empty state instead of any cover art

#### Scenario: Only an inactive work is currently reading
- **WHEN** a profile owner's only currently-reading King work has an active flag of false
- **THEN** the Currently Reading section shows an empty state instead of that work's cover art

### Requirement: Collection progress is a non-interactive indicator
The system SHALL display, on a showcase, a collection-progress indicator showing the profile owner's count of active King works marked owned out of the total number of active King works, and SHALL NOT navigate anywhere when activated. Inactive King works SHALL be excluded from both the owned count and the total.

#### Scenario: Collection progress reflects owned count
- **WHEN** a showcase is displayed for a profile owner who has marked some active King works owned
- **THEN** the collection-progress indicator shows their owned count out of the total number of active King works

#### Scenario: Collection progress does not navigate
- **WHEN** a visitor activates the collection-progress indicator
- **THEN** no navigation occurs

### Requirement: Bookshelf shows the profile owner's collection
The system SHALL display, on a showcase, a Bookshelf grid with one tile for each edition the profile owner has added to their collection for an active King work, plus one tile (using the work's fallback cover) for each active King work the profile owner has marked owned with no edition added. The system SHALL display an empty state when the collection is empty. Editions and owned-flags tied to an inactive King work SHALL NOT produce a tile.

#### Scenario: Collection with editions and edition-less owned works
- **WHEN** a showcase is displayed for a profile owner who has added editions for some active King works and marked others owned without picking an edition
- **THEN** the Bookshelf shows a tile for every added edition and a fallback-cover tile for every edition-less owned work

#### Scenario: Empty collection
- **WHEN** a showcase is displayed for a profile owner with nothing in their collection
- **THEN** the Bookshelf shows an empty state instead of any tiles

#### Scenario: A collected work becomes inactive
- **WHEN** a profile owner has an edition or an edition-less owned flag against a King work that is later marked inactive
- **THEN** no tile for that work appears on the Bookshelf

### Requirement: Owner sees a personalized owned-unread book recommendation
The system SHALL show the profile owner a recommendation for one active King work they own but have not read. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a visitor who is not the profile owner, even when the profile is public.

#### Scenario: Owner with an eligible recommendation
- **WHEN** the profile owner owns an active King work they have not read
- **THEN** their showcase recommends one such King work

#### Scenario: Owner with no eligible recommendation
- **WHEN** the profile owner owns no active King work they have not read
- **THEN** no owned-unread recommendation card is shown

#### Scenario: Visitor viewing another user's showcase sees no owned-unread recommendation
- **WHEN** a visitor who is not the profile owner views that profile's showcase, public or private
- **THEN** no owned-unread recommendation card is shown

### Requirement: Non-owner sees a gift-idea recommendation for a wanted-but-not-owned book
The system SHALL show a visitor who is not the profile's owner a recommendation for one active King work that is on the profile owner's read list but not on their shelf (marked `want_to_read` but not marked `owned`), with the meta text "It's on their read list, but not their shelf." The system SHALL show nothing in its place when no such King work exists (rather than an empty state), and SHALL NOT show this recommendation to the profile owner viewing their own showcase.

#### Scenario: Non-owner visitor with an eligible gift idea
- **WHEN** a visitor who is not the profile owner views a public showcase for an owner who wants to read an active King work they do not own
- **THEN** the showcase recommends one such King work as a gift idea, with the meta text "It's on their read list, but not their shelf"

#### Scenario: Non-owner visitor with no eligible gift idea
- **WHEN** a visitor who is not the profile owner views a public showcase for an owner with no active King work that is wanted-to-read but not owned
- **THEN** no gift-idea recommendation card is shown

#### Scenario: Profile owner viewing their own showcase sees no gift-idea recommendation
- **WHEN** the profile owner views their own showcase
- **THEN** no gift-idea recommendation card is shown, regardless of which King works they've read or own
