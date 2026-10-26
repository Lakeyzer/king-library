## MODIFIED Requirements

### Requirement: Reading-progress categories are compared as a two-bar chart per category
The system SHALL show, for each of the following categories, one chart containing a bar for the signed-in visitor and a bar for the other user, each in a distinct, consistent color across every category: Overall Bibliography, Short Works, Collection, and Adaptations Watched, followed by a "Series" group with one chart per series in the canonical series list, in the same order the profile showcase's Series section uses. The compare page SHALL NOT show separate Bachman Books or Dark Tower charts outside the Series group. Each bar SHALL be labeled with that user's username and SHALL be direct-labeled with that user's raw count for the category (not a percentage). A count of zero SHALL still render a visible, minimal bar rather than no bar at all. Each category's progress SHALL be computed the same way as on the profile showcase (see profile-showcase capability).

#### Scenario: Viewing a valid comparison
- **WHEN** a signed-in user views a comparison against another public (or their own) profile
- **THEN** each category chart, including one per series in the Series group, shows a bar for each user, in the same two colors across every category, each labeled with that user's username and that user's raw count

#### Scenario: Series charts match the showcase's series bars
- **WHEN** a signed-in user views a comparison
- **THEN** the Series group shows a chart for each of Dark Tower, Bachman Books, Talisman, Hodges & Holly, and Gwendy's Trilogy, and each user's count matches that user's own showcase series bar

#### Scenario: A user has a count of zero in a category
- **WHEN** a signed-in user or the other user has a count of zero in a given category
- **THEN** that user's bar in that category's chart is still visibly rendered (not absent), showing a count of 0

### Requirement: Progress-category charts are arranged in a responsive grid
The system SHALL arrange the four progress-category charts (Overall Bibliography, Short Works, Adaptations Watched, Collection) the same way as the profile showcase's Reading Progress section: two to a row from small screen widths up (a 2 by 2 grid), and one to a row below that. The Series group's charts SHALL follow the same layout as the profile showcase's Series section (see profile-showcase "Series bars are laid out by screen size"): at large screen widths the first two series share the first row at half width each and the rest follow three to a row; at medium screen widths the first series takes the first row on its own and the rest follow two to a row; at small screen widths each chart takes a row of its own.

#### Scenario: Viewing the progress-category grid on a large screen
- **WHEN** a comparison is viewed at a large screen width
- **THEN** the progress-category charts are arranged 2 to a row, and the Series charts show Dark Tower and Bachman Books side by side, then Talisman, Hodges & Holly, and Gwendy's Trilogy

#### Scenario: Viewing the progress-category grid on a medium screen
- **WHEN** a comparison is viewed at a medium screen width
- **THEN** the progress-category charts are arranged 2 to a row, and the Series charts show Dark Tower alone, then Bachman Books and Talisman, then Hodges & Holly and Gwendy's Trilogy

#### Scenario: Viewing the progress-category grid on a small screen
- **WHEN** a comparison is viewed at a small screen width
- **THEN** the progress-category charts and the Series charts are each arranged 1 to a row, below the small breakpoint
