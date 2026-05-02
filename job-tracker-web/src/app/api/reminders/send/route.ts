import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyCronSecret(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!provided || !expected) return false
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('x-cron-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id')
    .eq('sent', false)
    .lte('remind_at', new Date().toISOString())
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reminders?.length) {
    return NextResponse.json({ processed: 0 })
  }

  const ids = reminders.map(r => r.id)
  await supabase
    .from('reminders')
    .update({ sent: true, sent_at: new Date().toISOString() })
    .in('id', ids)

  return NextResponse.json({ processed: ids.length })
}
