import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch pending reminders
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*, application:applications(company, title)')
    .eq('sent', false)
    .lte('remind_at', new Date().toISOString())
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reminders?.length) {
    return NextResponse.json({ sent: 0 })
  }

  // Only send emails if Resend is configured
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  let emailsSent = 0

  for (const reminder of reminders) {
    if (resendKey && fromEmail && reminder.email_to) {
      try {
        const app = (reminder as any).application
        const subject = app
          ? `Reminder: ${reminder.title} — ${app.company}`
          : `Reminder: ${reminder.title}`

        const html = `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="margin:0 0 8px">${reminder.title}</h2>
            ${app ? `<p style="color:#6b7280;margin:0 0 16px">${app.company} — ${app.title}</p>` : ''}
            ${reminder.message ? `<p>${reminder.message}</p>` : ''}
            <a href="${appUrl}/applications" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#3b82f6;color:white;border-radius:6px;text-decoration:none">
              View applications
            </a>
            <p style="margin-top:32px;font-size:12px;color:#9ca3af">
              Manage reminders at <a href="${appUrl}/reminders">${appUrl}/reminders</a>
            </p>
          </div>
        `

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromEmail, to: reminder.email_to, subject, html }),
        })
        emailsSent++
      } catch {
        // Log but don't fail — still mark as sent to avoid spam retries
      }
    }

    await supabase
      .from('reminders')
      .update({ sent: true, sent_at: new Date().toISOString() })
      .eq('id', reminder.id)
  }

  return NextResponse.json({ processed: reminders.length, emails_sent: emailsSent })
}
