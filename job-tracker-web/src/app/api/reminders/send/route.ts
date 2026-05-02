import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resendKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

function verifyCronSecret(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!provided || !expected) return false
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendKey || !fromEmail) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('x-cron-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let remindersSent = 0
  let digestsSent = 0

  // ── 1. User-created reminders ────────────────────────────────────
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, application:applications(company, title)')
    .eq('sent', false)
    .lte('remind_at', new Date().toISOString())
    .limit(50)

  for (const reminder of reminders ?? []) {
    if (reminder.email_to) {
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
      const sent = await sendEmail(reminder.email_to, subject, html)
      if (sent) remindersSent++
    }

    await supabase
      .from('reminders')
      .update({ sent: true, sent_at: new Date().toISOString() })
      .eq('id', reminder.id)
  }

  // ── 2. Bookmark digest (every 3 days per user) ───────────────────
  if (resendKey && fromEmail) {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, last_bookmark_email_at')
      .or(`last_bookmark_email_at.is.null,last_bookmark_email_at.lte.${threeDaysAgo}`)

    for (const profile of profiles ?? []) {
      if (!profile.email) continue

      const { data: bookmarks } = await supabase
        .from('applications')
        .select('company, title, platform, status, url')
        .eq('user_id', profile.id)
        .eq('bookmarked', true)
        .order('created_at', { ascending: false })

      if (!bookmarks?.length) continue

      const STATUS_LABEL: Record<string, string> = {
        saved: 'Saved', applied: 'Applied', screening: 'Screening',
        interview: 'Interview', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
      }

      const rows = bookmarks.map(b => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
            <strong style="display:block">${b.company}</strong>
            <span style="color:#6b7280;font-size:13px">${b.title}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">${b.platform}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;white-space:nowrap">
            <span style="background:#f0f9ff;color:#0369a1;padding:2px 8px;border-radius:9999px">
              ${STATUS_LABEL[b.status] ?? b.status}
            </span>
          </td>
        </tr>
      `).join('')

      const firstName = profile.full_name?.split(' ')[0] ?? 'there'
      const subject = `📌 Your ${bookmarks.length} bookmarked job${bookmarks.length === 1 ? '' : 's'} — Job Tracker`

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 4px;color:#111827">Hey ${firstName} 👋</h2>
          <p style="color:#6b7280;margin:0 0 24px">
            You have ${bookmarks.length} bookmarked application${bookmarks.length === 1 ? '' : 's'} — here's a quick look.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Role</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Platform</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <a href="${appUrl}/bookmarks" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#3b82f6;color:white;border-radius:6px;text-decoration:none;font-weight:500">
            View bookmarks →
          </a>
          <p style="margin-top:32px;font-size:12px;color:#9ca3af">
            This digest is sent every 3 days while you have bookmarks.
            <a href="${appUrl}/bookmarks" style="color:#9ca3af">Manage at ${appUrl}/bookmarks</a>
          </p>
        </div>
      `

      const sent = await sendEmail(profile.email, subject, html)
      if (sent) {
        digestsSent++
        await supabase
          .from('profiles')
          .update({ last_bookmark_email_at: new Date().toISOString() })
          .eq('id', profile.id)
      }
    }
  }

  return NextResponse.json({ reminders_sent: remindersSent, digests_sent: digestsSent })
}
