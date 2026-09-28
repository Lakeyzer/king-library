import type { EmailMessage } from './sendEmail'
import { escapeHtml } from './escapeHtml'

// Same shell as buildSuggestionStatusEmail. `origin` is the request's own
// origin (getRequestURL(event).origin), so emails sent from local dev link
// back to localhost rather than production.
export function buildNewFollowerEmail(
  { to, followerUsername, origin }:
  { to: string, followerUsername: string, origin: string }
): EmailMessage {
  const followersUrl = `${origin}/following?tab=followers`
  const settingsUrl = `${origin}/settings/notifications`

  const subject = `${followerUsername} started following you on King Library`

  const text = [
    `${followerUsername} started following you on King Library.`,
    '',
    `See your followers: ${followersUrl}`,
    '',
    `To stop these emails, turn off "New followers" in your notification settings: ${settingsUrl}`
  ].join('\n')

  const username = escapeHtml(followerUsername)
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9f9f4;font-family:Georgia,'Times New Roman',serif;color:#1f1d1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e2d8;border-radius:8px;padding:24px;">
      <p style="margin:0 0 16px;font-size:18px;font-weight:bold;">King Library</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
        <strong>${username}</strong> started following you.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${followersUrl}" style="display:inline-block;background:#c05b3c;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">View your followers</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b675e;">
        To stop these emails, turn off "New followers" in your <a href="${settingsUrl}" style="color:#c05b3c;">notification settings</a>.
      </p>
    </div>
  </body>
</html>`

  return { to, subject, text, html }
}
