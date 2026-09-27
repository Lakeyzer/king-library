import type { EmailMessage } from './sendEmail'

// Mirrors SUGGESTION_STATUS_LABEL in app/composables/useSuggestions.ts -
// server code can't import from app/, and four labels aren't worth a
// shared/ directory of their own.
const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  rejected: 'Rejected',
  confirmed: 'Confirmed',
  applied: 'Applied'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// `origin` is the request's own origin (getRequestURL(event).origin), so
// emails sent from local dev link back to localhost rather than production.
export function buildSuggestionStatusEmail(
  { to, suggestionTitle, status, origin }:
  { to: string, suggestionTitle: string, status: string, origin: string }
): EmailMessage {
  const statusLabel = STATUS_LABEL[status] ?? status
  const notificationsUrl = `${origin}/notifications`
  const settingsUrl = `${origin}/settings`

  const subject = `Your suggestion "${suggestionTitle}" is now ${statusLabel}`

  const text = [
    `The status of your suggestion "${suggestionTitle}" has changed to ${statusLabel}.`,
    '',
    `See your notifications: ${notificationsUrl}`,
    '',
    `You're receiving this because you submitted this suggestion on King Library. To stop these emails, turn off "Suggestion updates" in your settings: ${settingsUrl}`
  ].join('\n')

  const title = escapeHtml(suggestionTitle)
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9f9f4;font-family:Georgia,'Times New Roman',serif;color:#1f1d1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e2d8;border-radius:8px;padding:24px;">
      <p style="margin:0 0 16px;font-size:18px;font-weight:bold;">King Library</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
        The status of your suggestion <strong>"${title}"</strong> has changed to <strong>${escapeHtml(statusLabel)}</strong>.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${notificationsUrl}" style="display:inline-block;background:#c05b3c;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;">View notifications</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b675e;">
        You're receiving this because you submitted this suggestion on King Library.
        To stop these emails, turn off "Suggestion updates" in your <a href="${settingsUrl}" style="color:#c05b3c;">settings</a>.
      </p>
    </div>
  </body>
</html>`

  return { to, subject, text, html }
}
