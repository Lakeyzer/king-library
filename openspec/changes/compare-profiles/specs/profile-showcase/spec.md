## ADDED Requirements

### Requirement: Non-owner visitor can navigate to a profile comparison
The system SHALL show a "Compare" control in a profile's header to a signed-in visitor who is not that profile's owner, shown only when the profile is public, linking to that profile's compare route (see the profile-compare capability). The system SHALL NOT show this control to a signed-out visitor or to the profile's own owner.

#### Scenario: Signed-in visitor sees the Compare control on a public profile
- **WHEN** a signed-in visitor who does not own the profile views a public profile's header
- **THEN** a "Compare" control is shown alongside the follow control, linking to that profile's compare route

#### Scenario: Signed-out visitor does not see the Compare control
- **WHEN** a signed-out visitor views any profile's header
- **THEN** no "Compare" control is shown

#### Scenario: Profile owner does not see the Compare control on their own profile
- **WHEN** the profile owner views their own header
- **THEN** no "Compare" control is shown

#### Scenario: Compare control is hidden on a private profile
- **WHEN** a signed-in visitor who does not own the profile views a private profile's header
- **THEN** no "Compare" control is shown
