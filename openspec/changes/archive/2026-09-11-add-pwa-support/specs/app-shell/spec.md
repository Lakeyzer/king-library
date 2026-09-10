## ADDED Requirements

### Requirement: Header offers an install entry point when installation is available
The system SHALL render, on the trailing side of the header alongside the color mode toggle, an "Install App" control when the app has signaled that an install prompt is available and the app is not already running in installed (standalone) mode. Activating the control SHALL trigger the platform install prompt. The control SHALL NOT be rendered when no install prompt is available or when the app is already installed.

#### Scenario: Install control appears when installable
- **WHEN** a visitor views the header while the platform has signaled an install prompt is available and the app is not already installed
- **THEN** the header displays an "Install App" control on its trailing side

#### Scenario: Activating the install control
- **WHEN** a visitor activates the "Install App" control
- **THEN** the platform's install prompt is shown

#### Scenario: Install control hidden once installed
- **WHEN** a visitor views the header while the app is already running in installed (standalone) mode
- **THEN** the header does not display the "Install App" control

#### Scenario: Install control hidden when no prompt is available
- **WHEN** a visitor views the header on a platform or browser that has not signaled an install prompt is available (for example, before the signal fires, or on a platform that never fires it)
- **THEN** the header does not display the "Install App" control
