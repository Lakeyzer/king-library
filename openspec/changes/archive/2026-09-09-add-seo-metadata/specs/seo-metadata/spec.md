## Purpose

Defines the page title, meta description, and social share image (Open Graph / Twitter card) that every route in the app must expose, so search engines can index each page meaningfully and sharing a link produces a useful preview.

## ADDED Requirements

### Requirement: Every page has a page-specific title
The system SHALL give every route a non-empty `<title>` that identifies that specific page (not a generic or placeholder value).

#### Scenario: Visiting any route
- **WHEN** a visitor loads any route in the app
- **THEN** the rendered `<title>` describes that specific page rather than a generic or placeholder value

### Requirement: Titles follow a site-wide template, except the homepage
The system SHALL render every page's title as `{page title} • King Library`, except the homepage, whose title SHALL be exactly `King Library` with no suffix.

#### Scenario: A non-home page's title includes the site name
- **WHEN** a visitor loads any route other than the homepage
- **THEN** the rendered `<title>` ends with ` • King Library`

#### Scenario: The homepage's title is the bare site name
- **WHEN** a visitor loads the homepage
- **THEN** the rendered `<title>` is exactly `King Library`, with no ` • King Library` suffix

### Requirement: Every page has a meta description
The system SHALL give every route a non-empty meta description summarizing that page's content, exposed both as the standard `description` meta tag and as the Open Graph/Twitter description used by link-preview consumers.

#### Scenario: Visiting any route
- **WHEN** a visitor loads any route in the app
- **THEN** the page exposes a non-empty meta description specific to that page's content

### Requirement: Work and short story descriptions fall back when curated content is missing
For a work detail page, the system SHALL use the work's curated description as the meta description when one exists, and SHALL use a generated fallback description (including at least the work's title and type) when it does not. For a short story detail page, which has no curated description of its own, the system SHALL always use a generated fallback description (including at least the story's title and type, and its original publish year when known).

#### Scenario: Work has a curated description
- **WHEN** a visitor loads a work detail page for a work with a non-empty curated description
- **THEN** the page's meta description is that curated description (subject to the length limit below)

#### Scenario: Work has no curated description
- **WHEN** a visitor loads a work detail page for a work with no curated description
- **THEN** the page's meta description is a generated fallback that includes the work's title

#### Scenario: Short story detail page
- **WHEN** a visitor loads a short story detail page
- **THEN** the page's meta description is a generated fallback that includes the story's title

### Requirement: Adaptation descriptions fall back when no synopsis is available
For an adaptation detail page, the system SHALL use the adaptation's external synopsis as the meta description when one is available, and SHALL use a generated fallback description (including at least the adaptation's title, release year, and type) when it is not.

#### Scenario: Adaptation has an external synopsis
- **WHEN** a visitor loads an adaptation detail page for an adaptation with an available external synopsis
- **THEN** the page's meta description is that synopsis (subject to the length limit below)

#### Scenario: Adaptation has no external synopsis
- **WHEN** a visitor loads an adaptation detail page for an adaptation with no linked external synopsis
- **THEN** the page's meta description is a generated fallback that includes the adaptation's title

### Requirement: Meta descriptions are capped to a safe length
The system SHALL truncate any meta description sourced from free-form content (a work's curated description, an adaptation's external synopsis) to at most 160 characters before exposing it as the page's meta description, without cutting the text off mid-word.

#### Scenario: Source content exceeds the length limit
- **WHEN** a work's curated description or an adaptation's external synopsis is longer than 160 characters
- **THEN** the page's meta description is truncated to 160 characters or fewer, ending at a word boundary

### Requirement: Work and adaptation detail pages expose a social share image
The system SHALL expose the work's cover image as the Open Graph/Twitter share image on a work detail page, and the adaptation's poster image as the Open Graph/Twitter share image on an adaptation detail page, whenever that artwork is available. When no cover or poster is available for the item, the page SHALL omit the share image rather than expose a broken or placeholder one.

#### Scenario: Work has a cover image
- **WHEN** a visitor shares a link to a work detail page for a work with a known cover image
- **THEN** the share preview includes that work's cover image alongside its title and description

#### Scenario: Adaptation has a poster image
- **WHEN** a visitor shares a link to an adaptation detail page for an adaptation with a known poster image
- **THEN** the share preview includes that adaptation's poster image alongside its title and description

#### Scenario: Work or adaptation has no artwork
- **WHEN** a visitor shares a link to a work or adaptation detail page for an item with no cover/poster image on record
- **THEN** the share preview includes the page's title and description with no share image

### Requirement: Other pages do not expose a social share image
The system SHALL NOT expose an Open Graph/Twitter share image for the homepage, listing pages (works, short stories, adaptations), short story detail pages, profile pages, settings, or onboarding — these expose title and description only.

#### Scenario: Sharing a page outside the work/adaptation detail pages
- **WHEN** a visitor shares a link to any page other than a work or adaptation detail page
- **THEN** the resulting preview includes that page's title and description with no share image
