## MODIFIED Requirements

### Requirement: Bookshelf uses a responsive masonry grid
The system SHALL lay out the Bookshelf as a masonry grid, showing 2 columns at the smallest supported viewport width and 4 columns at the largest.

#### Scenario: Smallest supported viewport
- **WHEN** a showcase is displayed at the smallest supported viewport width
- **THEN** the Bookshelf grid shows 2 columns

#### Scenario: Largest viewport
- **WHEN** a showcase is displayed at the largest viewport width
- **THEN** the Bookshelf grid shows 4 columns

### Requirement: King progress indicators and collection ignore By Other Hands works
The system SHALL count only King works in the showcase's Overall Bibliography and Collection indicators, in both the count and the total. A By Other Hands work the profile owner has read or owns SHALL NOT change either indicator. Series progress bars are not King-only: they count every counted member of their series, of either kind (see the king-series capability's per-series reading progress).

#### Scenario: A read By Other Hands work leaves Overall Bibliography unchanged
- **WHEN** a showcase is displayed for a profile owner who has read a By Other Hands work
- **THEN** the Overall Bibliography indicator's read count and total count only King works

#### Scenario: A read Dark Tower comic leaves the Dark Tower indicator unchanged
- **WHEN** a showcase is displayed for a profile owner who has read a Dark Tower By Other Hands comic that is not a Dark Tower series member
- **THEN** the Dark Tower series bar's read count and total are unchanged

#### Scenario: A By Other Hands series member counts toward its series bar
- **WHEN** a showcase is displayed for a profile owner who has read Gwendy's Magic Feather
- **THEN** the Gwendy's Trilogy series bar counts it, while the Overall Bibliography indicator does not

#### Scenario: An owned By Other Hands work leaves Collection unchanged
- **WHEN** a showcase is displayed for a profile owner who owns a By Other Hands work
- **THEN** the Collection indicator's owned count and total count only King works, while the Bookshelf still shows a tile for that By Other Hands work

## ADDED Requirements

### Requirement: Overall bibliography reading progress bar
The system SHALL display, on a showcase's Reading Progress section, an overall reading-progress indicator: the profile owner's count of active King works marked read out of all active King works. Inactive King works SHALL be excluded from both the read count and the total. The Reading Progress section SHALL NOT include Bachman or Dark Tower indicators; those are shown as series in the Series section instead.

#### Scenario: Overall progress reflects total read count
- **WHEN** a showcase is displayed for a profile owner who has marked some active King works read
- **THEN** the overall progress indicator shows their read count out of the total number of active King works

#### Scenario: Reading Progress no longer shows Bachman or Dark Tower bars
- **WHEN** a showcase is displayed
- **THEN** the Reading Progress section shows Overall Bibliography, Short Works, Adaptations Watched, and Collection, and no Bachman Books or Dark Tower indicator

#### Scenario: An inactive work is excluded from progress
- **WHEN** a profile owner has read a King work that is later marked inactive
- **THEN** that work no longer contributes to the read count or the total of the overall progress indicator

### Requirement: Series section shows one progress bar per series
The system SHALL display, on a showcase, a "Series" section with one reading-progress bar for every series in the canonical series list, labeled with the series' name and showing the profile owner's per-series reading progress (see the king-series capability). Bars SHALL appear in the same display order the series list is returned in (see the king-series capability), and every series SHALL have a bar even when the owner has read none of its members. The section is subject to the same private-profile rules as the rest of the showcase.

#### Scenario: Every series has a bar
- **WHEN** a showcase is displayed
- **THEN** the Series section shows a bar for each of Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy, in that order

#### Scenario: A series with nothing read still shows
- **WHEN** a showcase is displayed for a profile owner who has read no Talisman book
- **THEN** the Talisman bar is shown with a read count of 0 out of its total

#### Scenario: A newly added series appears without a code change
- **WHEN** a new series is added to the canonical series data
- **THEN** the Series section shows a bar for it, after the series that have a set place, with a default icon if none has been assigned to it

### Requirement: Series bars are laid out by screen size
The system SHALL lay out the Series section's bars as follows. At large screen widths, the first two series (Dark Tower and Bachman Books) SHALL share the first row at half width each, and the remaining series SHALL follow three to a row. At medium screen widths, the first series (Dark Tower) SHALL take the first row on its own at full width, and the remaining series SHALL follow two to a row. At small screen widths, every bar SHALL take a row of its own.

#### Scenario: Large screen
- **WHEN** a showcase's Series section is viewed at a large screen width
- **THEN** the first row shows Dark Tower and Bachman Books side by side, and the second row shows Talisman, Hodges & Holly, and Gwendy's Trilogy

#### Scenario: Medium screen
- **WHEN** a showcase's Series section is viewed at a medium screen width
- **THEN** Dark Tower fills the first row, Bachman Books and Talisman share the second, and Hodges & Holly and Gwendy's Trilogy share the third

#### Scenario: Small screen
- **WHEN** a showcase's Series section is viewed at a small screen width
- **THEN** each series bar takes a full-width row of its own

## REMOVED Requirements

### Requirement: Reading progress bars for overall, Bachman, and Dark Tower
**Reason**: Bachman and Dark Tower progress move out of Reading Progress into the Series section, and are measured from series membership instead of the `bachman` / `dark_tower` flags.
**Migration**: Overall progress is kept as "Overall bibliography reading progress bar". Bachman and Dark Tower progress are now the "Bachman Books" and "Dark Tower" bars under "Series section shows one progress bar per series".
