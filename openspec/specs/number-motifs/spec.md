# number-motifs Specification

## Purpose

Highlights the numbers 19 and 1999 wherever they appear standalone in rendered page text, as a Dark Tower numerology reference woven throughout the app.

## Requirements

### Requirement: Standalone occurrences of 19 and 1999 are highlighted
The system SHALL style every standalone occurrence of the number `19` or `1999` in rendered page text with a visually distinct `text-warning` treatment, applied app-wide wherever such page text is rendered. A "standalone" occurrence is one not adjacent to other digits, so the highlighting SHALL NOT apply to a number that merely contains `19` as a substring of a longer number (e.g. `1987`, `1990`, `219`).

#### Scenario: Exact 19 is highlighted
- **WHEN** rendered page text contains the standalone number `19` (e.g. "chapter 19")
- **THEN** that `19` is rendered with the `text-warning` highlight

#### Scenario: Exact 1999 is highlighted
- **WHEN** rendered page text contains the standalone number `1999`
- **THEN** that `1999` is rendered with the `text-warning` highlight

#### Scenario: 19 embedded in a longer number is not highlighted
- **WHEN** rendered page text contains a number like `1987` or `1990` that includes the digits `19` but is not exactly `19`
- **THEN** no highlight is applied to that number

#### Scenario: Highlighting applies across the app
- **WHEN** any page in the app renders text containing a standalone `19` or `1999`
- **THEN** that occurrence is highlighted consistently, regardless of which page it appears on

#### Scenario: Highlighting applies to user-authored content, not just bibliography data
- **WHEN** a user's own free-text content (e.g. a profile tagline) contains a standalone `19` or `1999`
- **THEN** that occurrence is highlighted the same as it would be in curated bibliography data
