## ADDED Requirements

### Requirement: Showcase shows the owner's tagline when set
The system SHALL display the profile owner's tagline on their Showcase, in place of the static "Stephen King reading showcase" subtitle, whenever a tagline is set, and SHALL show the static subtitle instead whenever no tagline is set.

#### Scenario: Owner has a tagline set
- **WHEN** a showcase is displayed for a profile owner who has set a tagline
- **THEN** the tagline is shown in place of the static "Stephen King reading showcase" subtitle

#### Scenario: Owner has no tagline set
- **WHEN** a showcase is displayed for a profile owner who has not set a tagline
- **THEN** the static "Stephen King reading showcase" subtitle is shown

### Requirement: Shareable showcase URL uses lowercase username
The system SHALL build the showcase's shareable URL using the fully lowercase form of the username, regardless of the letter case stored on the profile.

#### Scenario: Sharing a profile with a mixed-case username
- **WHEN** the owner activates "Share" on a showcase whose username contains uppercase letters
- **THEN** the URL copied or shared uses the fully lowercase form of the username

### Requirement: Non-owner visitor can follow or unfollow the profile owner
The system SHALL show a follow control on a showcase to a visitor who is not the profile's owner, reflecting whether the visitor currently follows the profile owner, and letting them toggle that state. The system SHALL route a signed-out visitor who activates the control to sign in instead of following.

#### Scenario: Signed-in visitor follows the profile owner
- **WHEN** a signed-in visitor who does not yet follow the profile owner activates the follow control
- **THEN** they begin following the profile owner and the control reflects the followed state

#### Scenario: Signed-in visitor unfollows the profile owner
- **WHEN** a signed-in visitor who already follows the profile owner activates the control
- **THEN** they stop following the profile owner and the control reflects the not-followed state

#### Scenario: Signed-out visitor activates the follow control
- **WHEN** a signed-out visitor activates the follow control on a showcase
- **THEN** they are directed to sign in instead of following anyone

## MODIFIED Requirements

### Requirement: Showcase reachable by username for any visitor
The system SHALL let anyone, including signed-out visitors, view a user's showcase by that user's username when the profile is public, resolving the username case-insensitively so any letter casing of a valid username reaches the same profile.

#### Scenario: A signed-in user views another public profile's showcase
- **WHEN** a signed-in user navigates to the showcase of another user whose profile is public
- **THEN** they see that user's dashboard

#### Scenario: A signed-out visitor views a public profile's showcase
- **WHEN** a signed-out visitor navigates to the showcase of a user whose profile is public
- **THEN** they see that user's dashboard without being asked to sign in

#### Scenario: Requesting a username that matches no profile
- **WHEN** a visitor navigates to a showcase URL for a username that matches no profile
- **THEN** they receive an indication that no such profile exists

#### Scenario: Visiting a showcase URL with different letter casing
- **WHEN** a visitor navigates to a showcase URL using different letter casing than the profile's stored username
- **THEN** they see the same profile's showcase as the canonical lowercase URL would show
