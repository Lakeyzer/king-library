## ADDED Requirements

### Requirement: Works list is filterable by series
The system SHALL allow a visitor to filter the works list with a dropdown that lists an "All works" option followed by every series in the canonical series list, in the same display order the series list is returned in (see the king-series capability). Selecting a series restricts the visible items to King works that are members of that series, plus any King work that is an alternate text of a member (e.g. the original Gunslinger alongside the Dark Tower series' Revised Edition). Selecting "All works" applies no series restriction. Only one series can be selected at a time. The works list shows only King works, so a By Other Hands series member (e.g. Gwendy's Magic Feather) never appears in it, whichever series is selected.

#### Scenario: Series dropdown lists every series
- **WHEN** a visitor opens the series filter dropdown
- **THEN** it lists "All works" followed by Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy

#### Scenario: Filtering to a series
- **WHEN** a visitor selects "Hodges & Holly" in the series filter
- **THEN** the list shows only the King works in the Hodges & Holly series, subject to any other active search or filters

#### Scenario: An alternate text is shown with its series
- **WHEN** a visitor selects "Dark Tower" in the series filter
- **THEN** the list includes both the original Gunslinger and The Gunslinger: Revised Edition

#### Scenario: A By Other Hands member is not listed
- **WHEN** a visitor selects "Gwendy's Trilogy" in the series filter
- **THEN** the list shows Gwendy's Button Box and Gwendy's Final Task, and not Gwendy's Magic Feather

#### Scenario: Clearing the series filter
- **WHEN** a visitor selects "All works" in the series filter
- **THEN** the list shows King works regardless of series membership, subject to any other active search or filters

## REMOVED Requirements

### Requirement: Works list is filterable by Bachman and Dark Tower flags
**Reason**: Replaced by a series dropdown driven by the canonical series list, which covers Bachman and Dark Tower along with every other series.
**Migration**: Use "Works list is filterable by series". Selecting "Bachman Books" or "Dark Tower" there gives the same works the old "Bachman" and "Dark Tower" options did.
