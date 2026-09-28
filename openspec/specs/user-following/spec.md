# user-following Specification

## Purpose

Lets a signed-in user follow other users' profiles and gives them a dedicated page to see who they follow, who follows them, and what the users they follow are currently reading, so users can keep track of friends' reading activity across the library.

## Requirements

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
The system SHALL provide a `/following` page, reachable only by a signed-in user. Its main area SHALL have two tabs: "Following", listing every user the signed-in user follows, and "Followers", listing every user who follows the signed-in user. "Following" SHALL be the tab shown by default, and the page SHALL open on the "Followers" tab when a link asks for it. Each tab SHALL show the total number of users it lists, not only the number on the current page. Alongside the tabs, a sidebar SHALL show what the users the signed-in user follows are currently reading.

#### Scenario: Signed-out visitor visits /following
- **WHEN** a signed-out visitor navigates to `/following`
- **THEN** they are not shown following content and are directed to sign in

#### Scenario: Viewing the following overview
- **WHEN** a signed-in user who follows one or more users navigates to `/following`
- **THEN** the "Following" tab is shown and lists each followed user

#### Scenario: Opening the followers tab from a link
- **WHEN** a signed-in user follows a link to `/following` that targets the "Followers" tab (for example from a new-follower email)
- **THEN** the page opens on the "Followers" tab

#### Scenario: Tabs show their counts
- **WHEN** a signed-in user who follows 20 users and has 3 followers navigates to `/following`
- **THEN** the "Following" tab shows a count of 20 and the "Followers" tab shows a count of 3

#### Scenario: Count updates after following back
- **WHEN** a signed-in user activates "Follow back" on the "Followers" tab
- **THEN** the "Following" tab's count goes up by one without a page reload

#### Scenario: Empty following list
- **WHEN** a signed-in user who follows no one navigates to `/following`
- **THEN** the "Following" tab shows an empty state instead of a list

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

#### Scenario: Sidebar is not limited to the current page of the Following tab
- **WHEN** a signed-in user follows more users than fit on one page of the "Following" tab
- **THEN** the sidebar still considers every followed user, not only those on the page being shown

### Requirement: Following and followers lists are paginated
The system SHALL show at most 15 users per page on each of the "Following" and "Followers" tabs, ordered by when the follow happened, most recent first. Each tab SHALL offer pagination controls when it has more than 15 users, and SHALL NOT show them otherwise. Each tab SHALL keep its own current page.

#### Scenario: More than one page of followers
- **WHEN** a signed-in user with 20 followers opens the "Followers" tab
- **THEN** the 15 most recent followers are shown, with pagination controls to reach the remaining 5

#### Scenario: One page or fewer
- **WHEN** a signed-in user follows 15 or fewer users
- **THEN** the "Following" tab lists all of them without pagination controls

#### Scenario: Newest follow first
- **WHEN** a signed-in user opens the "Followers" tab
- **THEN** the user who started following them most recently is listed first

### Requirement: Users in both lists are shown with avatar, username and tagline
The system SHALL show each user in the "Following" and "Followers" lists with their avatar (or a placeholder when they have none), their username and, when set, their tagline. Selecting the user SHALL take the viewer to that user's profile. Every row in both lists SHALL offer a Compare control that opens the comparison between the signed-in user and that user.

#### Scenario: Viewing a listed user
- **WHEN** a signed-in user views either list
- **THEN** each row shows the listed user's avatar or placeholder, username and tagline (if set)

#### Scenario: Opening a listed user's profile
- **WHEN** a signed-in user selects a user in either list
- **THEN** they are taken to that user's profile

#### Scenario: Comparing with a listed user
- **WHEN** a signed-in user activates Compare on a row in either list
- **THEN** they are taken to the comparison between themselves and that user

### Requirement: Signed-in user can see who follows them
The system SHALL list, on the "Followers" tab, every user who currently follows the signed-in user, and SHALL show an empty state when no one does. A user who unfollows SHALL no longer be listed. The system SHALL NOT let a user see who follows any other user.

#### Scenario: Viewing followers
- **WHEN** a signed-in user who has followers opens the "Followers" tab
- **THEN** each user who follows them is listed

#### Scenario: No followers
- **WHEN** a signed-in user whom no one follows opens the "Followers" tab
- **THEN** the tab shows an empty state instead of a list

#### Scenario: A follower unfollows
- **WHEN** a user unfollows the signed-in user
- **THEN** that user no longer appears on the signed-in user's "Followers" tab

#### Scenario: Another user's followers stay private
- **WHEN** a signed-in user tries to read the followers of a different user
- **THEN** no follow relationships of that other user are returned

### Requirement: Following back from the followers list
The system SHALL offer a "Follow back" control on each "Followers" row for a follower the signed-in user does not follow yet. Activating it SHALL follow that user, and the row SHALL then show that they are followed, without a page reload. Rows for followers the signed-in user already follows SHALL show that they are followed instead of the "Follow back" control.

#### Scenario: Following a follower back
- **WHEN** a signed-in user activates "Follow back" on a follower they don't follow yet
- **THEN** they now follow that user, the row shows them as followed, and the user appears on the "Following" tab

#### Scenario: Follower already followed
- **WHEN** a signed-in user views a follower they already follow
- **THEN** the row shows them as followed and offers no "Follow back" control
