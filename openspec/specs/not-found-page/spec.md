# not-found-page Specification

## Purpose

Provides a single, shared not-found page for any unmatched route or unresolved entity lookup, styled around *The Shining*'s Overlook Hotel, so unresolved navigation feels intentional rather than like a generic error screen.

## Requirements

### Requirement: Unmatched routes show an Overlook Hotel-themed not-found page
The system SHALL show a shared not-found page, visually themed around the Overlook Hotel (a hallway/maze visual treatment), when a visitor navigates to a route that does not resolve to any page, and SHALL display copy in the vein of "You've wandered into a room that isn't on the floor plan."

#### Scenario: Visiting an unmatched route
- **WHEN** a visitor navigates to a URL that does not match any route in the app
- **THEN** the Overlook Hotel-themed not-found page is shown, including copy in the vein of "You've wandered into a room that isn't on the floor plan."

### Requirement: Entity "not found" results use the shared not-found page
The system SHALL use the shared not-found page for any existing "not found" result produced when an entity lookup (a work, adaptation, or profile slug/username) does not match any record, in place of a bare or generic not-found result.

#### Scenario: Work slug does not match any work
- **WHEN** a visitor navigates to a work detail URL whose slug does not match any canonical King work
- **THEN** the shared Overlook Hotel-themed not-found page is shown

#### Scenario: Adaptation slug does not match any adaptation
- **WHEN** a visitor navigates to an adaptation detail URL whose slug does not match any canonical adaptation
- **THEN** the shared Overlook Hotel-themed not-found page is shown

#### Scenario: Profile username does not match any user
- **WHEN** a visitor navigates to a profile URL whose username does not match any user
- **THEN** the shared Overlook Hotel-themed not-found page is shown
