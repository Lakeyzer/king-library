import type { H3Event } from 'h3'

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

// Sends one transactional email through Resend's REST API. With no
// RESEND_API_KEY configured (the normal local-dev case) it logs the message
// instead and returns false, so the whole flow can be exercised locally
// without a Resend account. Resend errors are thrown to the caller, which
// decides whether they're fatal - see server/api/suggestions/[id]/status.patch.ts.
export async function sendEmail(event: H3Event, message: EmailMessage): Promise<boolean> {
  const { resendApiKey, emailFrom } = useRuntimeConfig(event)

  if (!resendApiKey) {
    console.info('[sendEmail] RESEND_API_KEY not set - email not sent:', {
      to: message.to,
      subject: message.subject,
      text: message.text
    })
    return false
  }

  if (!emailFrom) {
    throw new Error('EMAIL_FROM is not configured')
  }

  await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}` },
    body: {
      from: emailFrom,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html
    }
  })

  return true
}
