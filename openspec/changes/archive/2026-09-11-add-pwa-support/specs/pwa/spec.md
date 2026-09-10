## Purpose

Makes King Library installable as a Progressive Web App — a home-screen icon and standalone window — without taking on offline data access or caching of app or Supabase data.

## ADDED Requirements

### Requirement: Web app manifest describes an installable app
The system SHALL serve a web app manifest declaring the app's name, short name, theme color, background color, standalone display mode, start URL, and icon set (including a 192x192 icon, a 512x512 icon, and a maskable icon), so that browsers can present the app as installable.

#### Scenario: Manifest is reachable and valid
- **WHEN** a browser requests the app's web app manifest
- **THEN** the manifest is served with the required fields (name, short_name, icons, display, start_url) present and valid

### Requirement: Service worker satisfies installability without caching app or user data
The system SHALL register a service worker sufficient to meet browser installability criteria, and that service worker SHALL NOT precache app shell assets or cache any Supabase request or response.

#### Scenario: Visiting the app registers a non-caching service worker
- **WHEN** a visitor loads the app in a supporting browser
- **THEN** a service worker is registered for the app's origin

#### Scenario: Supabase requests are never cached offline
- **WHEN** the app makes a request to Supabase while the service worker is active
- **THEN** the service worker does not intercept the request to serve or store a cached response, and the request reaches the network as normal

#### Scenario: Offline load is not supported
- **WHEN** a visitor without a previous install opens the app while offline
- **THEN** the app is not required to render, since no offline app-shell caching is provided

### Requirement: App exposes whether an install prompt is currently available
The system SHALL expose, to the rest of the app, whether the platform has signaled that an install prompt can be triggered, and whether the app is already running in installed (standalone) mode.

#### Scenario: Platform signals install availability
- **WHEN** the browser fires its install-availability event for the app
- **THEN** the app records that an install prompt is available and can share that state with other parts of the app

#### Scenario: App is already installed
- **WHEN** the app is running in standalone/installed display mode
- **THEN** the app records that it is already installed, regardless of whether an install-availability event previously fired

### Requirement: App can trigger the platform install prompt on request
The system SHALL provide a way to trigger the platform's install prompt when one is available, and SHALL treat the prompt as unavailable once it has been triggered or dismissed until the platform signals availability again.

#### Scenario: Triggering an available install prompt
- **WHEN** something in the app requests the install prompt while one is available
- **THEN** the platform's install prompt is shown to the visitor

#### Scenario: Triggering with no prompt available
- **WHEN** something in the app requests the install prompt while none is available
- **THEN** no prompt is shown and no error is raised
