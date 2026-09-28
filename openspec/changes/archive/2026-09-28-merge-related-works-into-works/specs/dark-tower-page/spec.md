## ADDED Requirements

### Requirement: Dark Tower King progress, suggestions, and journey stats ignore By Other Hands works
The system SHALL consider only King works for the Dark Tower page's reading progress, Dark Tower Related reading progress, next core Dark Tower book suggestion, Dark Tower Related book suggestion, core-series and connected-works lists, and site-wide finished/on-the-way/not-started journey counts. This holds even for By Other Hands works flagged as Dark Tower. The Graphic Novels list and its comics progress remain the only Dark Tower page sections that show By Other Hands works.

#### Scenario: A Dark Tower comic is not a core Dark Tower book
- **WHEN** a signed-in visitor views the Dark Tower page
- **THEN** the core-series list, the Dark Tower reading progress total, and the next-book suggestion include only King works

#### Scenario: Reading a Dark Tower comic leaves King progress unchanged
- **WHEN** a signed-in visitor marks a Dark Tower By Other Hands comic read
- **THEN** their Dark Tower reading progress count is unchanged, and the site-wide journey counts are unchanged

## MODIFIED Requirements

### Requirement: Main area lists Dark Tower graphic novel omnibuses, each expandable to the comics it collects
The system SHALL display, in the main content area, a "Graphic Novels" accordion listing every active Dark Tower comic omnibus: a By Other Hands work in the comic category that is an omnibus collecting other By Other Hands works. The accordion SHALL be collapsed by default and expand one omnibus at a time. Each omnibus's own reading-status actions SHALL be visible and usable whether or not it is expanded. Expanding an omnibus SHALL reveal every comic it collects, each with its own independent reading-status actions - the same actions available on the By Other Hands page.

#### Scenario: Graphic Novels list shows collapsed omnibuses with their own actions
- **WHEN** any visitor views the Dark Tower page's Graphic Novels list
- **THEN** it shows every active Dark Tower comic omnibus, collapsed, each with its own reading-status actions visible, and without their collected comics shown

#### Scenario: Expanding an omnibus reveals its comics
- **WHEN** any visitor expands an omnibus in the Graphic Novels list
- **THEN** every comic it collects is shown

#### Scenario: Reading-status actions are available on a collected comic
- **WHEN** a signed-in user expands an omnibus in the Graphic Novels list
- **THEN** they can mark any comic it collects read (or otherwise track it) independently of the omnibus itself

#### Scenario: A King omnibus is never listed as a graphic novel
- **WHEN** any visitor views the Graphic Novels list
- **THEN** no King omnibus (such as a collected King edition) appears in it
