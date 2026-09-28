## ADDED Requirements

### Requirement: A user is notified when someone follows them
The system SHALL create a notification for a user whenever another user starts following them. The notification SHALL identify the follower by their current username and avatar and link to the follower's profile. If the same follower unfollows and follows again within 24 hours of the notification their earlier follow created, the system SHALL NOT create another notification. The system SHALL remove a follower's notifications when the follower's account is deleted. Unfollowing SHALL NOT remove a notification that was already created.

#### Scenario: Someone starts following a user
- **WHEN** a user follows another user
- **THEN** the followed user receives a notification naming the follower, with a link to the follower's profile

#### Scenario: Follow, unfollow and follow again within a day
- **WHEN** a user follows someone, unfollows, and follows them again within 24 hours
- **THEN** the followed user has only one notification about that follower

#### Scenario: Following again after more than a day
- **WHEN** a user follows someone again more than 24 hours after the notification their earlier follow created
- **THEN** the followed user receives a new notification

#### Scenario: Follower deletes their account
- **WHEN** a user who followed someone deletes their account
- **THEN** the notification about that follow no longer appears in the followed user's notification center

#### Scenario: Follower changes their username
- **WHEN** a follower changes their username after the notification was created
- **THEN** the notification shows their current username

### Requirement: New followers are also sent by email
When a notification is created because someone started following a user, the system SHALL also send an email about it to that user's account email address, unless they have turned off their "New followers" email setting. The email SHALL name the follower, link to the "Followers" tab of the `/following` page, and explain how to turn these emails off. The system SHALL NOT send an email when no notification was created (for example a repeat follow within 24 hours). If the email cannot be sent, the follow and the in-app notification SHALL still take effect.

#### Scenario: New follower emails the followed user
- **WHEN** a user follows someone whose "New followers" emails are turned on
- **THEN** the followed user receives an email naming the follower, with a link to their followers list

#### Scenario: New followers email turned off
- **WHEN** a user follows someone who has turned "New followers" off
- **THEN** no email is sent, and the followed user still receives the in-app notification

#### Scenario: Repeat follow within a day sends no email
- **WHEN** a user follows, unfollows and follows the same person again within 24 hours
- **THEN** only the first follow sends an email

#### Scenario: Email delivery fails
- **WHEN** a user follows someone and the email cannot be sent
- **THEN** the follow is saved and the followed user's in-app notification is still created

## MODIFIED Requirements

### Requirement: Users can control which emails they receive
The system SHALL provide an "Email notifications" section on the Notifications settings page (`/settings/notifications`), with one independent toggle per type of email the system sends: "Suggestion updates", which controls suggestion status-change emails, and "New followers", which controls new-follower emails. Each toggle SHALL be on by default for every user, including existing users. While a toggle is off, the system SHALL NOT send the user that type of email. Toggles SHALL NOT affect in-app notifications. A user's email settings SHALL NOT be visible to any other user. Every email the system sends SHALL link to the Notifications settings page as the place to turn it off.

#### Scenario: Default for a user who never changed the setting
- **WHEN** a signed-in user opens the Notifications settings page without ever having changed an email setting
- **THEN** both the "Suggestion updates" and "New followers" toggles are shown as on

#### Scenario: Existing user who already changed a toggle
- **WHEN** a user who turned "Suggestion updates" off before this change opens the Notifications settings page
- **THEN** "Suggestion updates" is still off and "New followers" is on

#### Scenario: Turning suggestion emails off
- **WHEN** a user turns "Suggestion updates" off and an admin later changes the status of one of their suggestions
- **THEN** no email is sent to them, and they still receive the in-app notification

#### Scenario: Toggles are independent
- **WHEN** a user turns "New followers" off and leaves "Suggestion updates" on
- **THEN** they still receive suggestion status-change emails but no new-follower emails

#### Scenario: Email settings are private
- **WHEN** a signed-in user tries to read another user's email settings
- **THEN** none of that user's settings are returned

### Requirement: A toast announces notifications that arrive while the app is open
The system SHALL show a toast when a notification is created for a signed-in user while they have the app open. The toast SHALL say what happened and offer a way to open the notification center:
- for a suggestion status change: the new status and the suggestion's name
- for an admin response: that an admin responded, and the suggestion's name
- for a new follower: the follower's username

The system SHALL NOT show toasts for notifications that already existed when the user opened or reloaded the app. Those are only reflected by the unread indicator and count.

#### Scenario: Notification arrives while the app is open
- **WHEN** an admin changes the status of a user's suggestion while that user has the app open
- **THEN** the user sees a toast naming the suggestion and its new status, with a way to open the notification center

#### Scenario: New follower while the app is open
- **WHEN** someone starts following a user who has the app open
- **THEN** the user sees a toast naming the new follower, with a way to open the notification center

#### Scenario: Unread notifications waiting on arrival
- **WHEN** a user with unread notifications opens or reloads the app
- **THEN** no toast is shown, and the unread indicator and count reflect those notifications

### Requirement: Notification center lists notifications newest first
The system SHALL list the signed-in user's notifications on the notification center page, newest first and paginated. Each entry SHALL show:
- what happened: a suggestion status change with the new status, an admin response with its text, or a new follower with their avatar and username linking to their profile
- for suggestion notifications, the suggestion's title
- when it happened
- whether the notification was unread when the page was opened

The page's description and empty state SHALL cover every kind of notification, not only suggestions.

#### Scenario: Viewing notifications
- **WHEN** a signed-in user with notifications opens the notification center
- **THEN** they see their notifications newest first, and any that were unread are visually distinguished

#### Scenario: Viewing a new-follower notification
- **WHEN** a signed-in user opens the notification center with a new-follower notification
- **THEN** the entry shows the follower's avatar and username, and selecting the follower opens their profile

#### Scenario: No notifications yet
- **WHEN** a signed-in user with no notifications opens the notification center
- **THEN** they see an empty state explaining that updates about their suggestions and new followers will appear there
