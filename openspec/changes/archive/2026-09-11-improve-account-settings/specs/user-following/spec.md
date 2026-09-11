## Purpose

Lets a signed-in user follow other users' profiles and gives them a dedicated page to see who they follow and what those followed users are currently reading, so users can keep track of friends' reading activity across the library.

## ADDED Requirements

### Requirement: Signed-in user can follow and unfollow another user
The system SHALL let a signed-in user follow another user's profile, and SHALL let them unfollow a profile they currently follow. A user SHALL NOT be able to follow their own profile.

#### Scenario: Following a profile
- **WHEN** a signed-in user activates the follow control on another user's profile
- **THEN** that user is added to their following list

#### Scenario: Unfollowing a profile
- **WHEN** a signed-in user who already follows a profile activates the control again
- **THEN** that user is removed from their following list

#### Scenario: A user's own profile has no follow control
- **WHEN** a signed-in user views their own profile
- **THEN** no follow control is shown

### Requirement: Following overview page
The system SHALL provide a `/following` page, reachable only by a signed-in user, showing an overview of every user the signed-in user follows, alongside a sidebar showing what those followed users are currently reading.

#### Scenario: Signed-out visitor visits /following
- **WHEN** a signed-out visitor navigates to `/following`
- **THEN** they are not shown following content and are directed to sign in

#### Scenario: Viewing the following overview
- **WHEN** a signed-in user who follows one or more users navigates to `/following`
- **THEN** the page lists each followed user

#### Scenario: Empty following list
- **WHEN** a signed-in user who follows no one navigates to `/following`
- **THEN** the page shows an empty state instead of a list

#### Scenario: Sidebar shows followed users' currently-reading works
- **WHEN** a signed-in user follows a user currently reading one or more King works
- **THEN** the sidebar on `/following` shows that followed user's currently-reading work(s)

#### Scenario: Followed user reading nothing is omitted from the sidebar
- **WHEN** a signed-in user follows a user who has nothing marked currently-reading
- **THEN** that followed user does not appear in the sidebar's currently-reading list

#### Scenario: Sidebar respects the followed user's privacy setting
- **WHEN** a signed-in user follows a user whose profile is private
- **THEN** that followed user's currently-reading data is not shown in the sidebar, consistent with how private collections are hidden elsewhere in the app

#### Scenario: No followed user is currently reading anything
- **WHEN** a signed-in user's followed users have nothing marked currently-reading, or they follow no one
- **THEN** the sidebar shows an empty state instead of a list
